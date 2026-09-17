import asyncio
import json
from io import BytesIO

import pytest
from starlette.datastructures import UploadFile

from frankie import agent_runtime, chat_title, llm, memory, web
from frankie.auth import UserIdentity
from frankie.config import VaultContext, use_vault_ctx


async def fake_title(_question):
    return "贝尔曼方程", llm.TokenUsage(1, 1, "fake")


@pytest.mark.asyncio
async def test_api_balance_uses_local_llm_module(monkeypatch):
    import frankie.llm as local_llm

    def fake_fetch_balance() -> dict:
        return {"available": True, "total_balance": "10.00", "currency": "CNY"}

    monkeypatch.setattr(local_llm, "fetch_balance", fake_fetch_balance)

    result = await web.api_balance()

    assert result["available"] is True
    assert result["total_balance"] == "10.00"


@pytest.mark.asyncio
@pytest.mark.parametrize("outcome", ["completed", "failed", "cancelled"])
async def test_chat_task_owns_persistence_and_explicit_stop(tmp_path, monkeypatch, outcome):
    ctx = VaultContext(root=tmp_path, frankie_dir=tmp_path / ".frankie")
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: ctx)
    monkeypatch.setattr(web, "answer_context", lambda: "")
    text = '原样保留：<sup>2</sup>\n< calls>\n'
    closed = False
    submitted_messages = []
    generated = asyncio.Event()

    async def fake_agent(_ctx, _system, messages, **_options):
        nonlocal closed
        submitted_messages.extend(messages)
        try:
            yield {"type": "agent_status", "call_id": "call_1", "name": "search_wiki", "status": "running"}
            yield {"type": "usage", "usage": llm.TokenUsage(3, 4, "fake")}
            yield {"type": "chunk", "text": text}
            generated.set()
            if outcome == "cancelled":
                await asyncio.Event().wait()
            if outcome == "failed":
                raise llm.ProtocolError("invalid provider response")
            yield {"type": "complete", "messages": [{"role": "assistant", "content": text}]}
        finally:
            closed = True

    monkeypatch.setattr(agent_runtime, "run_agent", fake_agent)
    monkeypatch.setattr(chat_title, "generate_title", fake_title)
    with use_vault_ctx(ctx):
        response = await web.api_chat(
            message="问题", session_id=None, thinking="off", edit_turn_id=None,
            files=[UploadFile(filename="diagram.png", file=BytesIO(b"test"))],
            user=UserIdentity("alice", role="admin"),
        )
        session_id = response["session_id"]
        reply = web.chat_runtime.replies[("alice", session_id)]
        await generated.wait()
        if outcome == "cancelled":
            await reply.stop()
        else:
            await reply.task
        assert closed
        saved = memory.load_session(session_id)
        assert saved["messages"][-1]["content"] == text
        assert saved["messages"][-1]["status"] == outcome
        assert response["attachments"] == saved["messages"][0]["attachments"]
        assert submitted_messages[-1]["content"][-1] == {
            "type": "image_url", "image_url": {"url": "data:image/png;base64,dGVzdA=="},
        }
        next_turn = memory.begin_chat_turn(
            session_id, user_id="alice", user_text="继续", attachments=[],
        )
        assert next_turn["history"] == [submitted_messages[-1], {"role": "assistant", "content": text}]


@pytest.mark.asyncio
async def test_compaction_keeps_complete_tool_transactions(monkeypatch):
    recent = [
        {"role": "user", "content": "第二问"},
        {"role": "assistant", "content": "", "tool_calls": [{"id": "call_2"}]},
        {"role": "tool", "tool_call_id": "call_2", "content": "资料"},
        {"role": "assistant", "content": "答案"},
    ]
    history = [{"role": "user", "content": "第一问"}, {"role": "assistant", "content": "x" * 3000}, *recent]

    async def summarize(*args, **kwargs):
        return "此前摘要", llm.TokenUsage(1, 1, "fake")

    monkeypatch.setattr(llm, "chat", summarize)
    compressed, _ = await web._compress_history(history, len(json.dumps(recent)) * 2 + 100)
    assert compressed[2:] == recent


@pytest.mark.asyncio
async def test_web_chat_uses_course_context_and_preserves_files(tmp_path, monkeypatch):
    from frankie import content

    course = VaultContext(root=tmp_path / "course", raw_sources_dir="raw")
    personal = VaultContext(root=tmp_path / "user", frankie_dir=tmp_path / "user" / ".frankie")
    course.wiki_path.mkdir()
    (course.wiki_path / "index.md").write_text("# 目录\n- [[Bellman]]", encoding="utf-8")
    (course.wiki_path / "Bellman.md").write_text("# Bellman\n最优性原理", encoding="utf-8")
    (course.wiki_path / "faq.md").write_text("# FAQ\n课程：动态优化", encoding="utf-8")
    before = {p.name: p.read_bytes() for p in course.wiki_path.iterdir()}
    personal.wiki_path.mkdir(parents=True)
    personal_page = personal.wiki_path / "Bellman.md"
    personal_page.write_text("PERSONAL PAGE MUST NOT BE COURSE EVIDENCE", encoding="utf-8")
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: course)
    monkeypatch.setattr(content, "shared_vault_ctx", lambda: course)
    requests = []
    answer = "最优性原理。[[Bellman]]"

    async def fake_agent(ctx, system, messages, **_options):
        assert ctx == course
        requests.append((system, messages))
        yield {"type": "chunk", "text": answer}
        yield {"type": "complete", "messages": [{"role": "assistant", "content": answer}]}

    monkeypatch.setattr(agent_runtime, "run_agent", fake_agent)
    monkeypatch.setattr(chat_title, "generate_title", fake_title)
    user = UserIdentity("alice", role="admin")
    with use_vault_ctx(personal):
        response = await web.api_chat(message="解释 Bellman", session_id=None, thinking="off", edit_turn_id=None, files=[], user=user)
        assert response["topic"] == "解释 Bellman"
        reply = web.chat_runtime.replies[("alice", response["session_id"])]
        await reply.task
        await asyncio.gather(*web.chat_runtime.side_tasks)
        saved = memory.load_session(response["session_id"])
        assert saved["messages"][-1]["status"] == "completed"
        assert saved["messages"][-1]["content"] == answer
        assert saved["topic"] == "贝尔曼方程"
    system, messages = requests[0]
    assert "课程：动态优化" in system
    assert str(personal.wiki_path) not in system
    assert "PERSONAL PAGE MUST NOT BE COURSE EVIDENCE" not in str((system, messages))
    assert before == {p.name: p.read_bytes() for p in course.wiki_path.iterdir()}
    assert personal_page.read_text(encoding="utf-8") == "PERSONAL PAGE MUST NOT BE COURSE EVIDENCE"
