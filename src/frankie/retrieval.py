"""Local, vector-free Wiki retrieval utilities."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from frankie.config import VaultContext


@dataclass(frozen=True)
class SearchResult:
    path: str
    title: str
    topic: str
    score: float
    snippet: str
    matched_terms: tuple[str, ...]

    def as_dict(self) -> dict[str, object]:
        return {
            "path": self.path,
            "title": self.title,
            "topic": self.topic,
            "score": round(self.score, 2),
            "snippet": self.snippet,
            "matched_terms": list(self.matched_terms),
        }


def _terms(query: str) -> list[str]:
    return [term.lower() for term in re.findall(r"[\u4e00-\u9fff]{2,}|[a-zA-Z0-9_]{2,}", query)]


def _title(path: Path) -> str:
    try:
        for line in path.read_text(encoding="utf-8").splitlines()[:20]:
            if line.startswith("title:"):
                return line.split(":", 1)[1].strip().strip("'\"")
            if line.startswith("# "):
                return line[2:].strip()
    except OSError:
        pass
    return path.stem


def _is_readable_page(path: Path, root: Path) -> bool:
    resolved = path.resolve()
    return (
        not path.is_symlink() and path.is_file()
        and resolved.is_relative_to(root) and resolved.suffix.lower() == ".md"
        and "slides" not in {part.lower() for part in resolved.relative_to(root).parts}
    )


def search_wiki(ctx: VaultContext, query: str, topic: str | None = None, limit: int = 8) -> list[SearchResult]:
    """Search concept Wiki pages, or lecture Markdown when topic is raw."""
    terms = _terms(query)
    root = ctx.wiki_path.resolve()
    if not root.exists():
        return []
    results: list[SearchResult] = []
    for path in root.rglob("*.md"):
        if not _is_readable_page(path, root) or path == root / ctx.wiki_index_file:
            continue
        relative = path.relative_to(root)
        parts = relative.parts
        current_topic = parts[0] if len(parts) > 1 else "root"
        if current_topic == "raw" and topic != "raw":
            continue
        if topic and current_topic != topic:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except OSError:
            continue
        title = _title(path)
        searchable = f"{title} {current_topic} {relative} {content}".lower()
        matched = tuple(term for term in terms if term in searchable)
        if not matched:
            continue
        score = sum(searchable.count(term) for term in matched)
        score += 5 * sum(term in title.lower() for term in matched)
        score += 3 * sum(term == current_topic.lower() for term in matched)
        first_term = matched[0]
        position = content.lower().find(first_term)
        start = max(0, position - 100)
        snippet = " ".join(content[start : start + 280].split())
        results.append(SearchResult(str(relative), title, current_topic, score, snippet, matched))
    results.sort(key=lambda item: (-item.score, item.path))
    return results[: max(1, min(limit, 20))]


def read_wiki_page(ctx: VaultContext, relative_path: str) -> dict[str, object]:
    """Read a course Wiki or lecture page within the content boundary."""
    root = ctx.wiki_path.resolve()
    path = root / relative_path
    if not _is_readable_page(path, root):
        raise ValueError("只能读取课程目录内可访问的 Markdown 页面")
    path = path.resolve()
    return {
        "path": str(path.relative_to(root)),
        "title": _title(path),
        "content": path.read_text(encoding="utf-8"),
    }


def list_topics(ctx: VaultContext) -> list[dict[str, object]]:
    root = ctx.wiki_path.resolve()
    if not root.exists():
        return []
    topics: list[dict[str, object]] = []
    for directory in sorted(path for path in root.iterdir() if path.is_dir() and not path.is_symlink() and path.name.lower() != "slides"):
        page_count = sum(_is_readable_page(path, root) for path in directory.rglob("*.md"))
        topics.append({"name": directory.name, "page_count": page_count})
    return topics
