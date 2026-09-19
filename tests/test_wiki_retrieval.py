"""Wiki search ranking, slide-level lecture hits, and heading-scoped reads."""

import pytest

from frankie import wiki_index
from frankie.config import VaultContext
from frankie.retrieval import read_wiki_page, search_wiki

FAQ = """# Course FAQ

## Assessment

### How is the course grade determined?

Assignments and a final exam.

## Frequently Asked Questions in Dynamic Optimization

### Constrained Optimization I

Lecture 4.

#### Does a zero multiplier mean the constraint is slack?

Not necessarily. Complementary slackness allows a binding constraint with a zero multiplier.

#### How do I check NDCQ for inequality constraints?

Keep only the binding inequalities and check the rank of their gradients.

#### How can I check NDCQ before finding any candidates?

Check which constraints can bind together anywhere in the feasible set.

#### When do I need to check NDCQ?

At the local maximizer, but you do not know it in advance.

### Infinite-Horizon Optimization and Dynamic Programming

#### Why does one Bellman equation contain a discount factor?

Continuation value is measured from the next period.
"""

PRINCIPLES = """# Dynamic Programming Principles

## Overview

Dynamic optimization is used for decisions unfolding over time, where a choice today changes the
state tomorrow. Dynamic programming breaks such a problem into a sequence of one-period problems.

## Connections

Dynamic optimization is used in growth, savings and investment models throughout the course.
"""

GROWTH = """# Optimal Growth Model

## Overview

The optimal growth model illustrates how dynamic optimization is used to choose consumption and
capital over time.
"""

LECTURE = """# Lecture

## Section A

### Subsection B

#### Slide 1
alpha concept

$$
f(x) = \\alpha x
$$

#### Slide 2
alpha application

- one
- two

### Subsection C

#### Slide 3
beta only

## Section D

#### Slide 4
gamma
"""


@pytest.fixture
def course(tmp_path, monkeypatch):
    monkeypatch.setattr(wiki_index.settings, "frankie_data_dir", tmp_path / "data")
    root = tmp_path / "llm_wiki"
    for name, text in {
        "index.md": "# Index",
        "faq.md": FAQ,
        "dynamic-programming/dynamic-programming-principles.md": PRINCIPLES,
        "dynamic-programming/optimal-growth-model.md": GROWTH,
        "raw/lectures/lecture-01.md": LECTURE,
    }.items():
        (root / name).parent.mkdir(parents=True, exist_ok=True)
        (root / name).write_text(text, encoding="utf-8")
    return VaultContext(root=root)


def test_generic_faq_ancestor_heading_does_not_crowd_out_concept_pages(course):
    results = search_wiki(course, "dynamic optimization what is it used for", limit=8)
    assert results, "expected matches"
    assert results[0].path.startswith("dynamic-programming/")
    assert {result.path for result in results[:3]} <= {
        "dynamic-programming/dynamic-programming-principles.md",
        "dynamic-programming/optimal-growth-model.md",
    }
    assert not any("ndcq" in result.heading_path.lower() or "multiplier" in result.heading_path.lower() for result in results)


def test_exact_faq_question_ranks_first(course):
    results = search_wiki(course, "does a zero multiplier mean the constraint is slack", limit=5)
    assert results[0].path == "faq.md"
    assert results[0].anchor == "does-a-zero-multiplier-mean-the-constraint-is-slack"
    assert results[0].heading_path.endswith("Does a zero multiplier mean the constraint is slack?")
    assert results[0].snippet.startswith("Not necessarily.")
    assert results[0].citation_target == "faq.md#does-a-zero-multiplier-mean-the-constraint-is-slack"


def test_raw_search_returns_each_matching_slide(course):
    results = search_wiki(course, "alpha", topic="raw", limit=8)
    assert [result.anchor for result in results] == ["slide-1", "slide-2"]
    assert all(result.path == "raw/lectures/lecture-01.md" for result in results)
    assert [result.heading_path for result in results] == [
        "Section A > Subsection B > Slide 1",
        "Section A > Subsection B > Slide 2",
    ]
    assert [result.citation_target for result in results] == [
        "raw/lectures/lecture-01.md#slide-1",
        "raw/lectures/lecture-01.md#slide-2",
    ]
    assert "alpha concept" in results[0].snippet and "application" not in results[0].snippet
    assert "alpha application" in results[1].snippet and "concept" not in results[1].snippet
    assert len(search_wiki(course, "alpha", topic="raw", limit=1)) == 1


def test_hierarchical_reads_slice_the_source_verbatim(course):
    full = read_wiki_page(course, "raw/lectures/lecture-01.md")["content"]
    assert full == LECTURE
    slide = read_wiki_page(course, "raw/lectures/lecture-01.md", "slide-1")
    assert slide["content"] == "#### Slide 1\nalpha concept\n\n$$\nf(x) = \\alpha x\n$$\n\n"
    assert slide["citation_target"] == "raw/lectures/lecture-01.md#slide-1"
    assert slide["heading_path"] == "Section A > Subsection B > Slide 1"
    subsection = read_wiki_page(course, "raw/lectures/lecture-01.md", "subsection-b")["content"]
    assert subsection.startswith("### Subsection B\n") and subsection.endswith("- one\n- two\n\n")
    assert "#### Slide 1" in subsection and "#### Slide 2" in subsection and "Subsection C" not in subsection
    section = read_wiki_page(course, "raw/lectures/lecture-01.md", "section-a")["content"]
    assert section.startswith("## Section A\n") and section.endswith("beta only\n\n")
    assert "Section D" not in section
    assert LECTURE.index(section) < LECTURE.index(subsection) < LECTURE.index(slide["content"])
    with pytest.raises(ValueError, match="missing-anchor"):
        read_wiki_page(course, "raw/lectures/lecture-01.md", "missing-anchor")


def test_search_hit_feeds_anchored_read_with_smaller_payload(course):
    hit = search_wiki(course, "alpha application", topic="raw", limit=1)[0]
    scoped = read_wiki_page(course, hit.path, hit.anchor)
    full = read_wiki_page(course, hit.path)
    assert scoped["content"] == "#### Slide 2\nalpha application\n\n- one\n- two\n\n"
    assert scoped["content"] in full["content"]
    assert len(scoped["content"]) * 3 < len(full["content"])
    assert scoped["citation_target"] == hit.citation_target


def test_outdated_index_schema_requires_explicit_rebuild(course):
    path = wiki_index.ensure_index(course)
    with wiki_index._connect(path) as connection:
        connection.execute("UPDATE wiki_metadata SET value = '2' WHERE key = 'schema_version'")
    with pytest.raises(ValueError, match="rebuild"):
        wiki_index.ensure_index(course)
    wiki_index.rebuild_index(course)
    assert search_wiki(course, "gamma", topic="raw")[0].anchor == "slide-4"
