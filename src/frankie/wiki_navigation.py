"""Authored index order shared by the Wiki library and Knowledge Map."""

from pathlib import Path
from urllib.parse import unquote, urlparse

from frankie.retrieval import _is_readable_page
from frankie.wiki_markdown import markdown_links


def apply_index_order(root: Path, pages: list[dict]) -> None:
    """Annotate accessible pages with their first link's position in index.md."""
    index = root / "index.md"
    if not _is_readable_page(index, root.resolve()):
        return
    inventory = {Path(page["abs_path"]).resolve(): page for page in pages}
    for order, link in enumerate(markdown_links(index.read_text(encoding="utf-8"))):
        parsed = urlparse(link)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = root / unquote(parsed.path).lstrip("/")
        if not target.suffix:
            target = target.with_suffix(".md")
        page = inventory.get(target.resolve())
        if page is not None:
            page.setdefault("index_order", order)
