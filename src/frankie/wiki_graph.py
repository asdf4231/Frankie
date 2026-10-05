"""A read-only map of concept pages and their authored Markdown links."""

from __future__ import annotations

from urllib.parse import unquote, urlparse

from frankie.config import VaultContext, hidden_content_dirs
from frankie.retrieval import _is_readable_page
from frankie.wiki_markdown import markdown_links, parse_markdown


def build_wiki_graph(ctx: VaultContext) -> dict:
    root = ctx.wiki_path.resolve()
    nodes = []
    destinations = {}
    for path in sorted(root.rglob("*.md")):
        relative = path.relative_to(root)
        # Root documents and indexes are navigation, not concepts. Lectures have their own view.
        if (
            len(relative.parts) < 2 or path.name.lower() == "index.md"
            or any(part.lower() in hidden_content_dirs() for part in relative.parts)
            or not _is_readable_page(path, root)
        ):
            continue
        source = path.read_text(encoding="utf-8")
        page = parse_markdown(source, path.stem)
        summary = next((
            section.body.strip().split("\n\n", 1)[0]
            for section in page.sections if section.title.casefold() == "overview"
        ), "")
        node_id = relative.as_posix()
        nodes.append({
            "id": node_id,
            "title": page.title,
            "topic": relative.parts[0],
            "summary": summary,
            "abs_path": str(path),
        })
        destinations[node_id] = markdown_links(source)

    # Resolve against the readable inventory, never fetch link targets or infer prerequisites.
    inventory = {(root / node["id"]).resolve(): node["id"] for node in nodes}
    edges: set[tuple[str, str]] = set()
    for node_id, links in destinations.items():
        for link in links:
            parsed = urlparse(link)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = unquote(parsed.path)
            base = root if target.startswith("/") else (root / node_id).parent
            candidate = base / target.lstrip("/")
            if not candidate.suffix:
                candidate = candidate.with_suffix(".md")
            target_id = inventory.get(candidate.resolve())
            if target_id and target_id != node_id and not candidate.is_symlink():
                edges.add((node_id, target_id))
    return {
        "nodes": nodes,
        "edges": [{"source": source, "target": target} for source, target in sorted(edges)],
    }
