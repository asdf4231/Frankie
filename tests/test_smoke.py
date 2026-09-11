"""Offline smoke tests for knowledge Q&A and runtime-state isolation."""

import pytest
from click.testing import CliRunner

from frankie import agent, llm
from frankie.auth import ensure_user_dirs
from frankie.cli import main
from frankie.config import VaultContext, use_vault_ctx
from frankie.vault import load_token_log


@pytest.mark.asyncio
@pytest.mark.parametrize("mode", ["query", "chat"])
async def test_knowledge_answer_preserves_wiki(tmp_path, monkeypatch, mode):
    ctx = VaultContext(root=tmp_path / "content", frankie_dir=tmp_path / "state")
    ctx.wiki_path.mkdir(parents=True)
    page = ctx.wiki_path / "API.md"
    page.write_text("# API\nFrankie 使用 DeepSeek API。", encoding="utf-8")
    index = ctx.wiki_path / "index.md"
    index.write_text("# 索引\n- [[API]]", encoding="utf-8")
    before = {p.relative_to(ctx.wiki_path): p.read_bytes() for p in ctx.wiki_path.rglob("*")}
    requests = []

    async def answer(system, messages):
        requests.append((system, messages))
        return "Frankie 使用 DeepSeek API。[[API]]", llm.TokenUsage(10, 5, "fake")

    monkeypatch.setattr(llm, "chat", answer)
    with use_vault_ctx(ctx):
        if mode == "query":
            result = await agent.query("Frankie 使用什么 API？", stream=False)
        else:
            result = await agent.chat_turn("Frankie 使用什么 API？", [], stream=False)
        assert result == "Frankie 使用 DeepSeek API。[[API]]"
        assert load_token_log()[0]["command"] == mode
    assert "Frankie 使用 DeepSeek API。" in str(requests)
    assert before == {p.relative_to(ctx.wiki_path): p.read_bytes() for p in ctx.wiki_path.rglob("*")}


def test_runtime_initialization_is_separate_from_content(tmp_path):
    user = VaultContext(root=tmp_path / "user", frankie_dir=tmp_path / "user" / ".frankie")
    ensure_user_dirs(user)
    assert user.frankie_dir.is_dir()
    assert not user.wiki_path.exists()


def test_cli_commands():
    result = CliRunner().invoke(main, ["--help"])
    assert result.exit_code == 0


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
