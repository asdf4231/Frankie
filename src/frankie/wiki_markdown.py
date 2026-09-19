"""Source-preserving Markdown sections, heading destinations, and excerpts."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import asdict, dataclass

import frontmatter
from markdown_it import MarkdownIt
from markdown_it.rules_block import StateBlock
from markdown_it.token import Token


def _display_math(state: StateBlock, start: int, end: int, silent: bool) -> bool:
    """Keep dollar-delimited display math atomic, also within list items."""
    line = state.src[state.bMarks[start] + state.tShift[start] : state.eMarks[start]]
    if not line.startswith("$$") or state.is_code_block(start):
        return False
    if silent:
        return True
    stop = start + 1
    if not (len(line.strip()) > 2 and line.rstrip().endswith("$$")):
        while stop < end:
            closing = state.src[state.bMarks[stop] : state.eMarks[stop]].strip()
            stop += 1
            if closing == "$$":
                break
    token = state.push("math_block", "math", 0)
    token.block = True
    token.map = [start, stop]
    token.content = state.getLines(start, stop, state.blkIndent, False)
    state.line = stop
    return True


_MARKDOWN = MarkdownIt("commonmark").enable("table")
_MARKDOWN.block.ruler.before("fence", "display_math", _display_math, {"alt": ["paragraph", "reference", "blockquote", "list"]})
_FRONTMATTER = re.compile(r"\A---[\t ]*\r?\n.*?^(?:---|\.\.\.)[\t ]*(?:\r?\n|$)", re.M | re.S)
_ANNOTATION = re.compile(r"^(?:Course(?: sources?)?|Original|PDF(?: pages)?|(?:Sub)?section|TeX equation labels):", re.I)
_LECTURE_REFERENCE = re.compile(r"Lectures?\s+\d+(?:\s*[-–,]\s*\d+)*\.?", re.I)


@dataclass(frozen=True)
class Heading:
    line: int
    level: int
    title: str
    anchor: str
    heading_path: str

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class Section:
    """Text under one top-level heading (the page preamble has level 0)."""

    ordinal: int
    heading_path: str
    anchor: str
    body: str
    level: int
    title: str
    line: int


@dataclass(frozen=True)
class WikiMarkdown:
    title: str
    headings: tuple[Heading, ...]
    sections: tuple[Section, ...]


def _heading_text(tokens: list[Token]) -> str:
    parts = []
    for token in tokens:
        if token.type in {"text", "code_inline"}:
            parts.append(token.content)
        elif token.type == "image":
            parts.append(_heading_text(token.children or []))
        elif token.type in {"softbreak", "hardbreak"}:
            parts.append(" ")
    return "".join(parts).strip()


def _slug(text: str) -> str:
    # GitHub-style course anchors: remove punctuation, but do not collapse spaces
    # after removing it ("46 — Blackwell's" -> "46--blackwells").
    return "".join(
        "-" if char.isspace() else char
        for char in text.lower()
        if char.isspace() or char in "-_" or unicodedata.category(char)[0] in "LNM"
    )


def _split_frontmatter(source: str) -> tuple[dict, str]:
    source = source.removeprefix("\ufeff")
    front = _FRONTMATTER.match(source)
    metadata = frontmatter.loads(front[0]).metadata if front else {}
    return metadata, source[front.end() :] if front else source


def _section(ordinal: int, heading: Heading | None, body: str) -> Section:
    if heading is None:
        return Section(ordinal, "", "", body, 0, "", 0)
    return Section(ordinal, heading.heading_path, heading.anchor, body, heading.level, heading.title, heading.line)


def parse_markdown(source: str, fallback_title: str = "") -> WikiMarkdown:
    """Parse once; heading line numbers refer to the body without frontmatter."""
    metadata, body = _split_frontmatter(source)
    lines = body.splitlines(keepends=True)
    tokens = _MARKDOWN.parse(body)
    title = str(metadata.get("title") or "")
    first_h1 = next((i for i, token in enumerate(tokens) if token.type == "heading_open" and token.tag == "h1" and token.level == 0), None)
    if not title and first_h1 is not None:
        title = _heading_text(tokens[first_h1 + 1].children or [])
    title = title or fallback_title
    used: set[str] = set()
    hierarchy: list[tuple[int, str]] = []
    headings: list[Heading] = []
    boundaries: list[tuple[int, int, Heading]] = []
    for index, token in enumerate(tokens):
        if token.type != "heading_open" or token.map is None:
            continue
        level = int(token.tag[1])
        text = _heading_text(tokens[index + 1].children or [])
        base = _slug(text)
        anchor = base
        suffix = 0
        while anchor in used:
            suffix += 1
            anchor = f"{base}-{suffix}"
        used.add(anchor)
        if token.level == 0:
            while hierarchy and hierarchy[-1][0] >= level:
                hierarchy.pop()
            if index != first_h1:
                hierarchy.append((level, text))
            heading_path = " > ".join(value for _, value in hierarchy)
        else:
            heading_path = " > ".join([*(value for _, value in hierarchy), text])
        heading = Heading(token.map[0] + 1, level, text, anchor, heading_path)
        headings.append(heading)
        if token.level == 0:
            boundaries.append((token.map[0], token.map[1], heading))

    sections: list[Section] = []
    start = 0
    current: Heading | None = None
    for heading_start, heading_end, heading in boundaries:
        text = "".join(lines[start:heading_start])
        if text.strip() or current is not None:
            sections.append(_section(len(sections), current, text))
        start = heading_end
        current = heading
    text = "".join(lines[start:])
    if text.strip() or current is not None:
        sections.append(_section(len(sections), current, text))
    return WikiMarkdown(title, tuple(headings), tuple(sections))


def heading_scope(source: str, anchor: str) -> tuple[Section, str]:
    """Slice the source verbatim from a heading through its last descendant.

    The slice ends immediately before the next heading whose level is at most
    the selected heading's level, so a `####` slide is returned alone while a
    `##` section carries every `###` and `####` under it.
    """
    page = parse_markdown(source)
    lines = _split_frontmatter(source)[1].splitlines(keepends=True)
    for index, section in enumerate(page.sections):
        if section.level and section.anchor == anchor:
            end = next(
                (later.line - 1 for later in page.sections[index + 1 :] if later.level <= section.level),
                len(lines),
            )
            return section, "".join(lines[section.line - 1 : end])
    raise ValueError(f"页面中没有标题锚点 '{anchor}'；请使用 search_wiki 结果中的 anchor")


def _source_blocks(body: str) -> list[tuple[int, int, str]]:
    """Pair whole source blocks with their visible, instructional text."""
    offsets = [0]
    for line in body.splitlines(keepends=True):
        offsets.append(offsets[-1] + len(line))
    tokens = _MARKDOWN.parse(body)
    roots = [i for i, token in enumerate(tokens) if token.level == 0 and token.map is not None]
    blocks = []
    for position, index in enumerate(roots):
        token = tokens[index]
        if token.type == "hr":
            continue
        assert token.map is not None
        start, end = (offsets[line] for line in token.map)
        next_index = roots[position + 1] if position + 1 < len(roots) else len(tokens)
        parts = []
        for child in tokens[index:next_index]:
            if child.type == "inline":
                parts.append(_heading_text(child.children or []))
            elif child.type in {"fence", "code_block", "math_block"}:
                parts.append(child.content)
        visible = "\n".join(parts).strip()
        if not visible:
            continue
        text = body[start:end]
        annotation = token.type == "blockquote_open" and all(
            _ANNOTATION.match(line.lstrip().removeprefix(">").strip())
            for line in text.splitlines() if line.strip().removeprefix(">").strip()
        )
        if annotation or (token.type == "paragraph_open" and (_ANNOTATION.match(visible) or _LECTURE_REFERENCE.fullmatch(visible))):
            continue
        blocks.append((start, end, visible))
    return blocks


def index_body(body: str) -> tuple[str, list[tuple[int, int, int]]]:
    """Index visible text, retaining offsets back to verbatim source blocks.

    Link destinations and source annotations are not explanatory evidence. FTS
    highlights refer to this text; the mapping recovers the original block.
    """
    parts = []
    spans = []
    offset = 0
    for start, _, text in _source_blocks(body):
        parts.append(text)
        spans.append((offset, offset + len(text), start))
        offset += len(text) + 2
    return "\n\n".join(parts), spans


def _blocks(body: str) -> list[tuple[int, int]]:
    return [(start, end) for start, end, _ in _source_blocks(body)]


def excerpt(body: str, matches: dict[str, list[tuple[int, int]]], *, budget: int = 900) -> str:
    """Select a contiguous, verbatim run of complete source blocks."""
    blocks = _blocks(body)
    if not blocks:
        return ""
    def strength(index: int) -> tuple[int, int, int]:
        start, end = blocks[index]
        hits = [term for term, spans in matches.items() for left, _ in spans if start <= left < end]
        return len(set(hits)), len(hits), -index
    best = max(range(len(blocks)), key=strength)
    left = right = best
    # Include neighboring explanation/equations, retaining original intervening
    # whitespace. Oversized equations/code/lists are never truncated.
    while True:
        candidates = []
        if right + 1 < len(blocks) and blocks[right + 1][1] - blocks[left][0] <= budget:
            candidates.append((strength(right + 1), left, right + 1))
        if left > 0 and blocks[right][1] - blocks[left - 1][0] <= budget:
            candidates.append((strength(left - 1), left - 1, right))
        if not candidates:
            break
        _, left, right = max(candidates)
    return body[blocks[left][0] : blocks[right][1]]
