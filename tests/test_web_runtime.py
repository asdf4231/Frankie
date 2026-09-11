import asyncio
import json
from io import BytesIO

import pytest
from starlette.datastructures import UploadFile

from frankie import agent, agent_runtime, llm, memory, web
from frankie.auth import UserIdentity
from frankie.config import VaultContext, use_vault_ctx


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
async def test_chat_stream_owns_persistence_and_disconnect_cleanup(tmp_path, monkeypatch, outcome):
    ctx = VaultContext(root=tmp_path, frankie_dir=tmp_path / ".frankie")
    monkeypatch.setattr(web, "shared_vault_ctx", lambda: ctx)
    monkeypatch.setattr(web, "answer_context", lambda: "")
    monkeypatch.setattr(agent, "wiki_context_budget", lambda *_: {"history_compact_at": 24_000})
    text = '原样保留：<sup>2</sup>\n< calls>\n'
    closed = False
    submitted_messages = []

    async def fake_agent(_ctx, _system, messages):
        nonlocal closed
        submitted_messages.extend(messages)
        try:
            yield {"type": "agent_status", "call_id": "call_1", "name": "search_wiki", "status": "running"}
            yield {"type": "usage", "usage": llm.TokenUsage(3, 4, "fake")}
            yield {"type": "chunk", "text": text}
            if outcome == "failed":
                raise llm.ProtocolError("invalid provider response")
            yield {"type": "complete", "messages": [{"role": "assistant", "content": text}]}
        finally:
            closed = True

    monkeypatch.setattr(agent_runtime, "run_agent", fake_agent)
    events = []

    async def send(message):
        body = message.get("body")
        if not body:
            return
        event = json.loads(body.decode().removeprefix("data: "))
        events.append(event)
        if event["type"] == "chunk" and outcome == "cancelled":
            # Cancellation during ASGI send, while the generator is suspended.
            raise asyncio.CancelledError
        if event["type"] == "done":
            saved = memory.load_session(events[0]["session_id"])
            assert saved["messages"][-1]["status"] == outcome

    with use_vault_ctx(ctx):
        response = await web.api_chat(
            message="问题", session_id=None,
            files=[UploadFile(filename="diagram.png", file=BytesIO(b"test"))],
            user=UserIdentity("alice", role="admin"),
        )
        if outcome == "cancelled":
            with pytest.raises(asyncio.CancelledError):
                await response.stream_response(send)
        else:
            await response.stream_response(send)
            assert events[-1]["type"] == "done"
            assert events[-1]["usage"] == {"prompt_tokens": 3, "completion_tokens": 4}
            assert any(e["type"] == "error" for e in events) == (outcome == "failed")
        assert closed
        session_id = events[0]["session_id"]
        saved = memory.load_session(session_id)
        assert saved["messages"][-1]["content"] == text
        assert saved["messages"][-1]["status"] == outcome
        assert [event["type"] for event in events[:3]] == ["session", "attachments", "agent_status"]
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
@pytest.mark.parametrize("mode", ["chat", "query"])
async def test_web_answers_use_course_context_and_preserve_files(tmp_path, monkeypatch, mode):
    from frankie import content

    course = VaultContext(root=tmp_path / "course", wiki_dir=".", raw_sources_dir="raw")
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

    async def fake_agent(ctx, system, messages):
        assert ctx == course
        requests.append((system, messages))
        yield {"type": "chunk", "text": answer}
        yield {"type": "complete", "messages": [{"role": "assistant", "content": answer}]}

    async def fake_stream(system, messages):
        requests.append((system, messages))
        yield llm.TextDelta(answer)
        yield llm.ResponseComplete(
            {"role": "assistant", "content": answer}, "stop", llm.TokenUsage(3, 4, "fake"),
        )

    monkeypatch.setattr(agent_runtime, "run_agent", fake_agent)
    monkeypatch.setattr(llm, "stream_response", fake_stream)
    user = UserIdentity("alice", role="admin")
    with use_vault_ctx(personal):
        memory.save_personal_memory("学习偏好", "详细推导")
        if mode == "chat":
            response = await web.api_chat(message="解释 Bellman", session_id=None, files=[], user=user)
        else:
            response = await web.api_query(web.QueryRequest(question="解释 Bellman"), user=user)
        events = [json.loads(chunk.removeprefix("data: ")) async for chunk in response.body_iterator]
        assert events[-1]["status"] == "completed"
        assert any(event.get("text") == answer for event in events)
    system, messages = requests[0]
    assert "课程：动态优化" in system
    assert "详细推导" in str((system, messages))
    assert str(personal.wiki_path) not in system
    assert "PERSONAL PAGE MUST NOT BE COURSE EVIDENCE" not in str((system, messages))
    if mode == "query":
        assert "最优性原理" in messages[-1]["content"]
    assert before == {p.name: p.read_bytes() for p in course.wiki_path.iterdir()}
    assert personal_page.read_text(encoding="utf-8") == "PERSONAL PAGE MUST NOT BE COURSE EVIDENCE"
