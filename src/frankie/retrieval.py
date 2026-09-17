"""Course Wiki search and page-reading tools."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

from frankie.config import VaultContext


@dataclass(frozen=True)
class SearchResult:
    path: str
    title: str
    topic: str
    score: float
    snippet: str
    matched_terms: tuple[str, ...]
    heading_path: str
    anchor: str
    citation_target: str

    def as_dict(self) -> dict[str, object]:
        return {
            "path": self.path,
            "title": self.title,
            "topic": self.topic,
            "score": self.score,
            "snippet": self.snippet,
            "matched_terms": list(self.matched_terms),
            "heading_path": self.heading_path,
            "anchor": self.anchor,
            "citation_target": self.citation_target,
        }


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
    """Return distinct pages ranked by their best matching Wiki sections."""
    from frankie.wiki_index import search_index

    return search_index(ctx, query, topic, limit)


def read_wiki_page(ctx: VaultContext, relative_path: str) -> dict[str, object]:
    """Read a course Wiki or lecture page within the content boundary."""
    root = ctx.wiki_path.resolve()
    path = root / relative_path
    if not _is_readable_page(path, root):
        raise ValueError("只能读取课程目录内可访问的 Markdown 页面")
    path = path.resolve()
    rel = str(path.relative_to(root))
    return {
        "path": rel,
        "title": _title(path),
        "citation_target": quote(rel, safe="/"),
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
