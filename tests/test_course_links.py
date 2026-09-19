"""Links between course pages resolve to the page and heading the reader scrolls to.

The wiki cites lecture slides as ``../raw/lectures/lecture-07.md#13--bellman-equation``,
sibling concepts as ``value-function.md#definition`` and the FAQ as ``../faq.md#question``;
the FAQ links back into both. The chat model cites the same targets as ``[[target|title]]``
and the search index emits them as ``citation_target``. Every path must agree on one anchor
per heading regardless of the heading's level (``##`` sections, ``####`` slides).
"""

import os
import re
from pathlib import Path

import pytest
from fastapi import HTTPException

from frankie import web, wiki_index
from frankie.auth import UserIdentity
from frankie.config import VaultContext, settings, use_vault_ctx
from frankie.retrieval import read_wiki_page, search_wiki

LECTURE = """# Lecture 7 — Finite-Horizon Dynamic Programming

#### 2 — Chapter Overview

Sequential decisions.

## Problem Description

#### 13 — Bellman Equation

The value today is the best current payoff plus continuation value.

$$
V_t(x) = \\max_u \\{ f(x, u) + V_{t+1}(g(x, u)) \\}
$$

#### 14 — Bellman Equation: Proof Sketch

Backward induction.

## Contraction Results

#### 46 — Blackwell’s Sufficient Conditions

Monotonicity and discounting.
"""

BELLMAN = """---
title: Bellman Equation
tags: [dynamic-programming]
---
# Bellman Equation

> Course sources: Lecture 7, slides [13–14](../raw/lectures/lecture-07.md#13--bellman-equation)

## Overview

Links: [Value Function](value-function.md#definition), [Jacobian](../multivariable-calculus/jacobian-derivative.md#jacobian-matrix),
[zero multiplier](../faq.md#does-a-zero-multiplier-mean-the-constraint-is-slack), [whole page](value-function.md).

## Stationary infinite-horizon form

**Course source:** Lecture 7, slide [46](../raw/lectures/lecture-07.md#46--blackwells-sufficient-conditions).
"""

VALUE_FUNCTION = """# Value Function

## Definition

See the [Bellman equation](bellman-equation.md#stationary-infinite-horizon-form) and
[proof sketch](../raw/lectures/lecture-07.md#14--bellman-equation-proof-sketch).
"""

JACOBIAN = """# Jacobian Derivative

## Jacobian matrix

Rows are gradients.
"""

FAQ = """# Course FAQ

## Course Info

### When are office hours?

Tuesday.

## Frequently Asked Questions in Dynamic Optimization

### Constrained Optimization I

#### Does a zero multiplier mean the constraint is slack?

Not necessarily; see [Bellman Equation](dynamic-programming/bellman-equation.md#overview)
and [slide 13](raw/lectures/lecture-07.md#13--bellman-equation).

#### Where is the chapter overview?

[Slide 2](raw/lectures/lecture-07.md#2--chapter-overview).
"""

PAGES = {
    "index.md": "# Index\n\n- [Bellman Equation](dynamic-programming/bellman-equation.md)\n",
    "faq.md": FAQ,
    "dynamic-programming/bellman-equation.md": BELLMAN,
    "dynamic-programming/value-function.md": VALUE_FUNCTION,
    "multivariable-calculus/jacobian-derivative.md": JACOBIAN,
    "raw/lectures/lecture-07.md": LECTURE,
}

# Every markdown link in the fixture, keyed by source page: (target, rel_path, anchor, level).
EXPECTED_LINKS = {
    "dynamic-programming/bellman-equation.md": {
        ("../raw/lectures/lecture-07.md#13--bellman-equation", "raw/lectures/lecture-07.md", "13--bellman-equation", 4),
        ("value-function.md#definition", "dynamic-programming/value-function.md", "definition", 2),
        ("../multivariable-calculus/jacobian-derivative.md#jacobian-matrix", "multivariable-calculus/jacobian-derivative.md", "jacobian-matrix", 2),
        ("../faq.md#does-a-zero-multiplier-mean-the-constraint-is-slack", "faq.md", "does-a-zero-multiplier-mean-the-constraint-is-slack", 4),
        ("value-function.md", "dynamic-programming/value-function.md", "", 0),
        ("../raw/lectures/lecture-07.md#46--blackwells-sufficient-conditions", "raw/lectures/lecture-07.md", "46--blackwells-sufficient-conditions", 4),
    },
    "dynamic-programming/value-function.md": {
        ("bellman-equation.md#stationary-infinite-horizon-form", "dynamic-programming/bellman-equation.md", "stationary-infinite-horizon-form", 2),
        ("../raw/lectures/lecture-07.md#14--bellman-equation-proof-sketch", "raw/lectures/lecture-07.md", "14--bellman-equation-proof-sketch", 4),
    },
    "faq.md": {
        ("dynamic-programming/bellman-equation.md#overview", "dynamic-programming/bellman-equation.md", "overview", 2),
        ("raw/lectures/lecture-07.md#13--bellman-equation", "raw/lectures/lecture-07.md", "13--bellman-equation", 4),
        ("raw/lectures/lecture-07.md#2--chapter-overview", "raw/lectures/lecture-07.md", "2--chapter-overview", 4),
    },
    "index.md": {
        ("dynamic-programming/bellman-equation.md", "dynamic-programming/bellman-equation.md", "", 0),
    },
}

_LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)\)")


def markdown_links(text: str) -> list[str]:
    """Course links: a page path or a same-page anchor, never a URL or a bracketed formula such as [a](x)."""
    return [target for target in _LINK.findall(text) if ".md" in target or target.startswith("#")]


def write_course(root: Path, pages: dict[str, str]) -> None:
    for name, text in pages.items():
        (root / name).parent.mkdir(parents=True, exist_ok=True)
        (root / name).write_text(text, encoding="utf-8")


@pytest.fixture
def course(tmp_path, monkeypatch):
    monkeypatch.setattr(wiki_index.settings, "frankie_data_dir", tmp_path / "data")
    course = VaultContext(root=tmp_path / "llm_wiki", raw_sources_dir="raw")
    write_course(course.wiki_path, PAGES)
    personal = VaultContext(root=tmp_path / "user", frankie_dir=tmp_path / "state")
    personal.wiki_path.mkdir(parents=True)
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: course)
    return course, personal


async def resolve_and_open(course: VaultContext, target: str, source: str | None) -> tuple[dict, dict]:
    """Do what the frontend does: resolve the link, then load the page the reader shows."""
    user = UserIdentity("alice")
    resolved = await web.api_wiki_resolve(target, source=str(course.wiki_path / source) if source else None, user=user)
    assert resolved["layer"] == "course"
    assert resolved["abs_path"] == str(course.wiki_path / resolved["rel_path"])
    page = await web.api_file(resolved["abs_path"], user=user)
    return resolved, page


def heading_for(page: dict, anchor: str) -> dict:
    matches = [heading for heading in page["headings"] if heading["anchor"] == anchor]
    assert len(matches) == 1, f"anchor {anchor!r} must identify exactly one heading, got {matches}"
    return matches[0]


@pytest.mark.parametrize("source", sorted(EXPECTED_LINKS))
async def test_every_link_in_a_page_opens_the_intended_heading(course, source):
    course, personal = course
    text = (course.wiki_path / source).read_text(encoding="utf-8")
    targets = markdown_links(text)
    assert set(targets) == {target for target, *_ in EXPECTED_LINKS[source]}, "fixture and expectations drifted"
    with use_vault_ctx(personal):
        for target, rel_path, anchor, level in EXPECTED_LINKS[source]:
            resolved, page = await resolve_and_open(course, target, source)
            assert resolved["rel_path"] == rel_path, target
            assert resolved["anchor"] == anchor, target
            if anchor:
                heading = heading_for(page, anchor)
                assert heading["level"] == level, target
                assert resolved["heading_path"] == heading["heading_path"], target
            else:
                assert resolved["heading_path"] == ""


async def test_lecture_slide_anchor_reaches_a_fourth_level_heading_the_reader_can_scroll_to(course):
    course, personal = course
    with use_vault_ctx(personal):
        resolved, page = await resolve_and_open(course, "../raw/lectures/lecture-07.md#13--bellman-equation", "dynamic-programming/bellman-equation.md")
    heading = heading_for(page, "13--bellman-equation")
    assert heading["level"] == 4
    assert heading["title"] == "13 — Bellman Equation"
    assert resolved["heading_path"] == "Problem Description > 13 — Bellman Equation"
    # The reader assigns ids by (line, level); line numbers count the frontmatter-free body from 1.
    body_lines = page["content"].splitlines()
    assert body_lines[heading["line"] - 1] == "#### 13 — Bellman Equation"
    assert resolved["title"] == "Lecture 7 — Finite-Horizon Dynamic Programming"


async def test_heading_lines_skip_frontmatter_so_reader_ids_land_on_the_right_heading(course):
    course, personal = course
    with use_vault_ctx(personal):
        _, page = await resolve_and_open(course, "dynamic-programming/bellman-equation.md#stationary-infinite-horizon-form", None)
    body = page["content"].split("---\n", 2)[2]
    for heading in page["headings"]:
        line = body.splitlines()[heading["line"] - 1]
        assert line == f"{'#' * heading['level']} {heading['title']}", heading


@pytest.mark.parametrize("level", [2, 3, 4])
async def test_slide_anchor_does_not_depend_on_heading_level(course, level):
    course, personal = course
    lecture = course.wiki_path / "raw/lectures/lecture-07.md"
    lecture.write_text(LECTURE.replace("#### ", "#" * level + " "), encoding="utf-8")
    with use_vault_ctx(personal):
        resolved, page = await resolve_and_open(course, "../raw/lectures/lecture-07.md#46--blackwells-sufficient-conditions", "dynamic-programming/bellman-equation.md")
    assert resolved["anchor"] == "46--blackwells-sufficient-conditions"
    assert heading_for(page, "46--blackwells-sufficient-conditions")["level"] == level


@pytest.mark.parametrize(("citation", "rel_path", "anchor"), [
    ("raw/lectures/lecture-07.md#13--bellman-equation|Lecture 7, slide 13", "raw/lectures/lecture-07.md", "13--bellman-equation"),
    ("raw/lectures/lecture-07.md#13--bellman-equation", "raw/lectures/lecture-07.md", "13--bellman-equation"),
    ("faq.md#does-a-zero-multiplier-mean-the-constraint-is-slack|FAQ", "faq.md", "does-a-zero-multiplier-mean-the-constraint-is-slack"),
    ("dynamic-programming/bellman-equation.md#overview|Bellman Equation", "dynamic-programming/bellman-equation.md", "overview"),
    ("dynamic-programming/bellman-equation.md|Bellman Equation", "dynamic-programming/bellman-equation.md", ""),
])
async def test_chat_citations_resolve_without_a_source_page(course, citation, rel_path, anchor):
    course, personal = course
    with use_vault_ctx(personal):
        resolved, page = await resolve_and_open(course, citation, None)
    assert (resolved["rel_path"], resolved["anchor"]) == (rel_path, anchor)
    if anchor:
        heading_for(page, anchor)


async def test_search_results_and_scoped_reads_agree_with_the_resolver(course):
    course, personal = course
    hits = [*search_wiki(course, "bellman equation", limit=8), *search_wiki(course, "bellman continuation", topic="raw", limit=8)]
    assert {hit.path for hit in hits} >= {"faq.md", "dynamic-programming/bellman-equation.md", "raw/lectures/lecture-07.md"}
    with use_vault_ctx(personal):
        for hit in hits:
            resolved, page = await resolve_and_open(course, hit.citation_target, None)
            assert resolved["rel_path"] == hit.path
            assert resolved["anchor"] == hit.anchor
            heading = heading_for(page, hit.anchor)
            assert heading["heading_path"] == hit.heading_path
            scoped = read_wiki_page(course, hit.path, hit.anchor)
            assert scoped["citation_target"] == hit.citation_target
            assert scoped["content"].startswith(f"{'#' * heading['level']} {heading['title']}\n")


@pytest.mark.parametrize(("target", "source", "status"), [
    ("../raw/lectures/lecture-07.md#13--bellman", "dynamic-programming/bellman-equation.md", 404),
    ("../raw/lectures/lecture-07.md#2--summary", "dynamic-programming/bellman-equation.md", 404),
    ("raw/lectures/lecture-99.md#13--bellman-equation", None, 404),
    ("../raw/lectures/lecture-07.md#13--bellman-equation", "raw/lectures/lecture-07.md", 404),
])
async def test_dangling_links_fail_with_an_explanation(course, target, source, status):
    course, personal = course
    with use_vault_ctx(personal), pytest.raises(HTTPException) as error:
        await web.api_wiki_resolve(target, source=str(course.wiki_path / source) if source else None, user=UserIdentity("alice"))
    assert error.value.status_code == status
    assert error.value.detail


@pytest.mark.skipif(not os.environ.get("FRANKIE_AUDIT_COURSE_LINKS"), reason="set FRANKIE_AUDIT_COURSE_LINKS=1 to check the real course wiki")
async def test_real_course_wiki_has_no_dangling_links(tmp_path, monkeypatch):
    """Walk every markdown link in the configured course wiki and list the ones that do not resolve."""
    root = settings.course_wiki_path.expanduser().resolve()
    assert root.is_dir(), root
    course = VaultContext(root=root, raw_sources_dir="raw")
    personal = VaultContext(root=tmp_path / "user", frankie_dir=tmp_path / "state")
    personal.wiki_path.mkdir(parents=True)
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: course)
    broken: list[str] = []
    checked = 0
    with use_vault_ctx(personal):
        for page in sorted(root.rglob("*.md")):
            rel = page.relative_to(root).as_posix()
            if "slides" in {part.lower() for part in page.relative_to(root).parts} or rel.endswith("~"):
                continue
            for target in dict.fromkeys(markdown_links(page.read_text(encoding="utf-8"))):
                checked += 1
                try:
                    await web.api_wiki_resolve(target, source=str(page), user=UserIdentity("audit"))
                except HTTPException as error:
                    broken.append(f"{rel}: ({target}) -> {error.detail}")
    assert not broken, f"{len(broken)} of {checked} links do not resolve:\n" + "\n".join(broken)
