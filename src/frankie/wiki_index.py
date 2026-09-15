"""Deployment-built, shared SQLite FTS5 retrieval for the course Wiki."""

from __future__ import annotations

import fcntl
import hashlib
import json
import re
import sqlite3
import threading
from collections.abc import Generator
from contextlib import closing
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from frankie.config import VaultContext, settings
from frankie.retrieval import SearchResult, _is_readable_page
from frankie.wiki_markdown import excerpt, index_body, parse_markdown

_SCHEMA_VERSION = "2"
_NAV_INDEX_FILE = "index.md"
_STOP_WORDS = frozenset({
    "a", "about", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from",
    "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "what", "when", "where",
    "which", "who", "why", "with",
})
_LOCKS: dict[Path, threading.Lock] = {}
_LOCKS_GUARD = threading.Lock()


def _index_path(ctx: VaultContext) -> Path:
    root_hash = hashlib.sha256(str(ctx.wiki_path.resolve()).encode()).hexdigest()[:24]
    return settings.frankie_data_dir / "search" / f"wiki_{root_hash}.sqlite3"


def _connect(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path, timeout=60)
    connection.row_factory = sqlite3.Row
    return connection


def _current(connection: sqlite3.Connection, root: Path) -> bool:
    if not connection.execute("SELECT 1 FROM sqlite_master WHERE name = 'wiki_metadata'").fetchone():
        return False
    metadata = dict(connection.execute("SELECT key, value FROM wiki_metadata"))
    if metadata.get("schema_version") != _SCHEMA_VERSION or metadata.get("wiki_root") != str(root):
        # A still-running worker must not overwrite a newer deployment's index.
        raise ValueError("Wiki search index is incompatible with this process; rebuild the index and restart the service")
    return True


def _sources(ctx: VaultContext) -> list[tuple[Path, int, int]]:
    root = ctx.wiki_path.resolve()
    return [
        (path, stat.st_size, stat.st_mtime_ns)
        for path in sorted(root.rglob("*.md"))
        if _is_readable_page(path, root) and path != root / _NAV_INDEX_FILE
        for stat in [path.stat()]
    ]


def _manifest(root: Path, sources: list[tuple[Path, int, int]]) -> str:
    records = [(path.relative_to(root).as_posix(), size, mtime) for path, size, mtime in sources]
    return hashlib.sha256(json.dumps(records, ensure_ascii=False).encode()).hexdigest()


def _build(ctx: VaultContext, *, force: bool) -> Path:
    root = ctx.wiki_path.resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Wiki directory does not exist: {root}")
    path = _index_path(ctx)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _LOCKS_GUARD:
        lock = _LOCKS.setdefault(path, threading.Lock())
    with lock, path.with_suffix(".lock").open("a") as process_lock, closing(_connect(path)) as connection:
        # WAL initialization itself needs serialization, before SQLite can take
        # the transaction's writer lock. Keep the lock file stable across builds.
        fcntl.flock(process_lock, fcntl.LOCK_EX)
        connection.execute("PRAGMA journal_mode = WAL")
        # Serialize writers across processes too. Readers see the previous committed
        # index throughout a deployment rebuild, never a half-populated FTS table.
        connection.execute("BEGIN IMMEDIATE")
        try:
            if not force and _current(connection, root):
                connection.commit()
                return path
            sources = _sources(ctx)
            manifest = _manifest(root, sources)
            for table in ("wiki_sections_fts", "wiki_sections", "wiki_metadata"):
                connection.execute(f"DROP TABLE IF EXISTS {table}")
            connection.execute("CREATE TABLE wiki_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
            connection.execute("""
                CREATE TABLE wiki_sections (
                    id INTEGER PRIMARY KEY,
                    path TEXT NOT NULL,
                    ordinal INTEGER NOT NULL,
                    topic TEXT NOT NULL,
                    page_title TEXT NOT NULL,
                    heading_path TEXT NOT NULL,
                    anchor TEXT NOT NULL,
                    body TEXT NOT NULL,
                    search_body TEXT NOT NULL,
                    body_spans TEXT NOT NULL,
                    UNIQUE(path, ordinal)
                )
            """)
            connection.execute("""
                CREATE VIRTUAL TABLE wiki_sections_fts USING fts5(
                    page_title, heading_path, topic, search_body,
                    content='wiki_sections', content_rowid='id',
                    tokenize='porter unicode61'
                )
            """)
            for source, _, _ in sources:
                relative = source.relative_to(root)
                topic = relative.parts[0] if len(relative.parts) > 1 else "root"
                page = parse_markdown(source.read_text(encoding="utf-8"), source.stem)
                for section in page.sections:
                    searchable, spans = index_body(section.body)
                    if not searchable:
                        continue
                    connection.execute(
                        "INSERT INTO wiki_sections(path, ordinal, topic, page_title, heading_path, anchor, body, search_body, body_spans) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (relative.as_posix(), section.ordinal, topic, page.title, section.heading_path, section.anchor, section.body, searchable, json.dumps(spans)),
                    )
            if manifest != _manifest(root, _sources(ctx)):
                raise OSError("Wiki changed during indexing; rebuild again after the update finishes")
            connection.execute("INSERT INTO wiki_sections_fts(wiki_sections_fts) VALUES ('rebuild')")
            connection.executemany(
                "INSERT INTO wiki_metadata(key, value) VALUES (?, ?)",
                [("schema_version", _SCHEMA_VERSION), ("wiki_root", str(root)), ("source_manifest", manifest)],
            )
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
    return path


def ensure_index(ctx: VaultContext) -> Path:
    """Use the deployed index; build only when absent, never during a schema mismatch."""
    path = _index_path(ctx)
    if path.is_file():
        with closing(_connect(path)) as connection:
            if _current(connection, ctx.wiki_path.resolve()):
                return path
    return _build(ctx, force=False)


def rebuild_index(ctx: VaultContext) -> Path:
    """Explicitly refresh the complete snapshot after a course checkout update."""
    return _build(ctx, force=True)


def _terms(query: str) -> list[str]:
    # The model supplies English words, not FTS syntax. Separators (including
    # apostrophes and underscores) agree with unicode61's default tokenization.
    return list(dict.fromkeys(term for term in re.findall(r"[a-z0-9]+", query.lower()) if term not in _STOP_WORDS))[:12]


def _candidates(connection: sqlite3.Connection, expression: str, topic: str | None, *, faq: bool) -> Generator[sqlite3.Row]:
    clause = "s.topic = ?" if topic else "s.topic != 'raw'"
    # The shared FAQ page title is not evidence that an individual entry matches.
    if faq:
        expression = f"{{heading_path search_body}} : ({expression})"
        clause += " AND s.path = 'faq.md' AND s.heading_path != ''"
    else:
        clause += " AND s.path != 'faq.md'"
    parameters = (expression, topic) if topic else (expression,)
    cursor = connection.execute(f"""
        SELECT s.id, s.path, bm25(wiki_sections_fts, 8.0, 12.0, 8.0, 1.0) AS rank
        FROM wiki_sections_fts JOIN wiki_sections s ON s.id = wiki_sections_fts.rowid
        WHERE wiki_sections_fts MATCH ? AND {clause}
        ORDER BY rank, s.path, s.ordinal
    """, parameters)
    try:
        # Continue past the first batch when many sections belong to the same page.
        while batch := cursor.fetchmany(30):
            yield from batch
    finally:
        cursor.close()


def _match_offsets(highlighted: str, opening: str, closing: str) -> list[tuple[int, int]]:
    matches = []
    offset = removed = 0
    while (start := highlighted.find(opening, offset)) >= 0:
        end = highlighted.index(closing, start + len(opening))
        left = start - removed
        matches.append((left, left + end - start - len(opening)))
        offset = end + len(closing)
        removed += len(opening) + len(closing)
    return matches


def search_index(ctx: VaultContext, query: str, topic: str | None, limit: int) -> list[SearchResult]:
    terms = _terms(query)
    if not terms or not ctx.wiki_path.is_dir():
        return []
    path = ensure_index(ctx)
    quoted = [f'"{term}"' for term in terms]
    all_terms, any_terms = " AND ".join(quoted), " OR ".join(quoted)
    results: list[SearchResult] = []
    seen: set[tuple[str, int]] = set()
    limit = max(1, min(limit, 20))
    with closing(_connect(path)) as connection:
        # AND/OR ranking, highlights and term coverage must use the same snapshot.
        connection.execute("BEGIN")
        winners: list[sqlite3.Row] = []
        # FAQ entries are separate answers, not competing snippets of one page.
        # Apply AND/OR fallback within each source class before moving to the next.
        for faq in (True, False):
            for expression in dict.fromkeys((all_terms, any_terms)):
                with closing(_candidates(connection, expression, topic, faq=faq)) as candidates:
                    for row in candidates:
                        key = (row["path"], row["id"] if faq else 0)
                        if key not in seen:
                            winners.append(row)
                            seen.add(key)
                            if len(winners) == limit:
                                break
                if len(winners) == limit:
                    break
            if len(winners) == limit:
                break
        opening, closing_marker = f"<{uuid4().hex}>", f"</{uuid4().hex}>"
        for winner in winners:
            row = connection.execute("SELECT * FROM wiki_sections WHERE id = ?", (winner["id"],)).fetchone()
            matches: dict[str, list[tuple[int, int]]] = {}
            body_spans = json.loads(row["body_spans"])
            for term, expression in zip(terms, quoted, strict=True):
                hit = connection.execute(
                    "SELECT highlight(wiki_sections_fts, 3, ?, ?) FROM wiki_sections_fts WHERE rowid = ? AND wiki_sections_fts MATCH ?",
                    (opening, closing_marker, row["id"], expression),
                ).fetchone()
                if hit is not None:
                    # Keep the original query term identity when several inflected
                    # source words match it, measuring coverage by distinct query terms.
                    matches[term] = [
                        (source_start, source_start)
                        for left, _ in _match_offsets(hit[0], opening, closing_marker)
                        for start, end, source_start in body_spans if start <= left < end
                    ]
            anchor = row["anchor"]
            target = quote(row["path"], safe="/") + (f"#{quote(anchor, safe='')}" if anchor else "")
            results.append(SearchResult(
                path=row["path"], title=row["page_title"], topic=row["topic"],
                score=-winner["rank"],
                snippet=row["body"].strip("\r\n") if row["path"] == "faq.md" else excerpt(row["body"], matches),
                matched_terms=tuple(matches), heading_path=row["heading_path"],
                anchor=anchor, citation_target=target,
            ))
    return results
