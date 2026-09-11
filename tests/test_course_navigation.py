"""Course navigation, search boundaries, and content/runtime separation."""

from urllib.parse import quote

import httpx
import pytest
from fastapi import HTTPException

from frankie import agent, cli, retrieval, web
from frankie.auth import UserIdentity
from frankie.config import VaultContext, use_vault_ctx


@pytest.fixture(params=["local-course", "server/frankie/course/llm_wiki"])
def course_files(tmp_path, monkeypatch, request):
    course = VaultContext(root=tmp_path / request.param, wiki_dir=".", raw_sources_dir="raw")
    personal = VaultContext(root=tmp_path / "user", frankie_dir=tmp_path / "state")
    files = {
        "index.md": "# 目录",
        "topic/Wiki.md": "# 概念\n[讲义](../raw/第%201%20讲.md)",
        "topic/Peer.md": "# 相邻页面",
        "Peer.md": "# 根目录页面",
        "raw/第 1 讲.md": "# 第一讲\nLECTURE_ONLY_EVIDENCE",
        "raw/_index.md": "# 讲义目录",
        "log.md": "# 日志概念\nVISIBLE_CONCEPT",
        "slides/private.md": "# 幻灯片",
    }
    for name, text in files.items():
        path = course.wiki_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    personal.wiki_path.mkdir(parents=True)
    (personal.wiki_path / "Peer.md").write_text("# 个人页面", encoding="utf-8")
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: course)
    return course, personal


@pytest.mark.asyncio
@pytest.mark.parametrize(("target", "with_source", "expected"), [
    ("../raw/第%201%20讲.md", True, "raw/第 1 讲.md"),
    ("../raw/第%201%20讲.md#公式", True, "raw/第 1 讲.md"),
    ("/raw/第%201%20讲.md", True, "raw/第 1 讲.md"),
    ("raw/第 1 讲.md", False, "raw/第 1 讲.md"),
    ("第 1 讲", False, "raw/第 1 讲.md"),
    ("第 1 讲.md", False, "raw/第 1 讲.md"),
    ("第一讲", False, "raw/第 1 讲.md"),
    ("Peer.md", True, "topic/Peer.md"),
    ("Peer", False, "Peer.md"),
    ("#概念", True, "topic/Wiki.md"),
    ("../raw/_index.md", True, "raw/_index.md"),
])
async def test_resolve_course_links(course_files, target, with_source, expected):
    course, personal = course_files
    user = UserIdentity("alice")
    source = str(course.wiki_path / "topic/Wiki.md") if with_source else None
    with use_vault_ctx(personal):
        resolved = await web.api_wiki_resolve(target, source=source, user=user)
        assert resolved["abs_path"] == str(course.wiki_path / expected)
        assert resolved["rel_path"] == expected
        assert resolved["layer"] == "course"
        content = await web.api_file(resolved["abs_path"], user=user)
        assert content["content"] == (course.wiki_path / expected).read_text(encoding="utf-8")


@pytest.mark.asyncio
@pytest.mark.parametrize(("target", "status"), [
    ("../slides/private.md", 403),
    ("../../outside.md", 403),
    ("%2e%2e/%2e%2e/outside.md", 403),
    ("missing.md", 404),
    ("https://example.com/lecture.md", 400),
    ("", 404),
])
async def test_invalid_links_fail_explicitly(course_files, target, status):
    course, personal = course_files
    with use_vault_ctx(personal), pytest.raises(HTTPException) as error:
        await web.api_wiki_resolve(target, source=str(course.wiki_path / "topic/Wiki.md"))
    assert error.value.status_code == status
    assert error.value.detail


@pytest.mark.asyncio
async def test_encoded_filename_and_exact_relative_target(course_files):
    course, _ = course_files
    page = course.wiki_path / "raw/讲义#1.md"
    page.write_text("# 特殊文件名", encoding="utf-8")
    resolved = await web.api_wiki_resolve(f"raw/{quote(page.name)}")
    assert resolved["abs_path"] == str(page)
    # A root file must not substitute for a missing relative file.
    with pytest.raises(HTTPException) as error:
        await web.api_wiki_resolve("log.md", source=str(course.wiki_path / "topic/Wiki.md"))
    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_file_and_source_paths_respect_course_boundary(course_files):
    course, personal = course_files
    personal_page = personal.wiki_path / "Peer.md"
    link = course.wiki_path / "outside.md"
    link.symlink_to(personal_page)
    for path in (personal_page, link, course.wiki_path / "slides/private.md"):
        with pytest.raises(HTTPException) as error:
            await web.api_file(str(path))
        assert error.value.status_code == 403
    with pytest.raises(HTTPException) as error:
        await web.api_wiki_resolve("Peer", source=str(personal_page))
    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_course_status_browsing_and_search(course_files, monkeypatch):
    course, personal = course_files
    monkeypatch.setattr("frankie.vault.summarize_token_log", lambda: {"total_tokens": 7})
    monkeypatch.setattr("frankie.vault.tokens_used_today", lambda: 7)
    with use_vault_ctx(personal):
        sources = await web.api_sources()
        assert {item["path"] for item in sources["files"]} == {"第 1 讲.md", "_index.md"}
        status = await web.api_status(UserIdentity("alice"))
        assert status["wiki"]["path"] == str(course.wiki_path)
        assert status["wiki"]["exists"]
        assert status["wiki"]["total_notes"] == 5
        assert status["vault"]["raw_sources_dir"] == str(course.raw_sources_path)
        assert status["quota"]["used_today"] == 7
        assert status["context"] == agent.wiki_context_budget([course])
    assert not retrieval.search_wiki(course, "LECTURE_ONLY_EVIDENCE")
    results = retrieval.search_wiki(course, "VISIBLE_CONCEPT")
    assert any(result.path == "log.md" for result in results)
    assert "LECTURE_ONLY_EVIDENCE" not in agent._load_wiki_context_for(course)
    assert "VISIBLE_CONCEPT" in agent._load_wiki_context_for(course)


@pytest.mark.asyncio
async def test_navigation_http_contract(course_files, monkeypatch):
    course, _ = course_files
    monkeypatch.setitem(web.app.dependency_overrides, web.get_current_user, lambda: UserIdentity("alice"))
    transport = httpx.ASGITransport(app=web.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/wiki/resolve", params={
            "title": "../raw/第%201%20讲.md",
            "source": str(course.wiki_path / "topic/Wiki.md"),
        })
        assert response.status_code == 200
        page = await client.get("/api/file", params={"path": response.json()["abs_path"]})
        assert page.status_code == 200
        assert "LECTURE_ONLY_EVIDENCE" in page.json()["content"]
        missing = await client.get("/api/wiki/resolve", params={"title": "raw/missing.md"})
        assert missing.status_code == 404
        assert missing.json()["detail"]


def test_cli_lists_sources_inside_wiki(tmp_path, monkeypatch, capsys):
    ctx = VaultContext(root=tmp_path, raw_sources_dir="frankie-wiki/raw")
    ctx.raw_sources_path.mkdir(parents=True)
    (ctx.raw_sources_path / "lecture.md").write_text("# 讲义", encoding="utf-8")
    monkeypatch.setattr(cli.settings, "vault_path", tmp_path)
    monkeypatch.setattr(cli.settings, "vault_wiki_dir", "frankie-wiki")
    monkeypatch.setattr(cli.settings, "vault_raw_sources_dir", "frankie-wiki/raw")
    with use_vault_ctx(ctx):
        cli._print_sources()
    assert "lecture.md" in capsys.readouterr().out
