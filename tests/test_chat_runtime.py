import asyncio
from types import SimpleNamespace

import pytest

from frankie import chat_runtime
from frankie.chat_runtime import Reply


async def _collect(reply: Reply) -> list[dict]:
    events = []
    async for event in reply.events():
        if event is not None:
            events.append(event)
    return events


@pytest.mark.asyncio
async def test_reply_reset_replaces_visible_text_for_live_and_late_subscribers():
    reply = Reply("alice", "s1", "t1")
    reply.append("Round one ")
    reply.append("draft.")
    live = asyncio.create_task(_collect(reply))
    await asyncio.sleep(0.1)
    reply.reset()
    reply.append("Round two.")
    await asyncio.sleep(0.1)
    late = asyncio.create_task(_collect(reply))
    await asyncio.sleep(0.1)
    reply.reset()
    reply.append("Final ")
    await asyncio.sleep(0.1)
    reply.append("answer.")
    await asyncio.sleep(0.1)
    reply.finish("completed", None)
    live_events, late_events = await asyncio.gather(live, late)

    assert live_events[0] == {
        "type": "reply", "turn_id": "t1", "text": "Round one draft.", "reset": True,
        "reasoning": "", "reasoning_reset": True, "reasoning_active": True,
        "reasoning_seconds": 0.0,
        "status": "running", "error": None, "agent_status": None,
    }
    # A withdrawn round arrives as a full replacement, never as a delta.
    assert [(e["reset"], e["text"]) for e in live_events[1:]] == [
        (True, "Round two."), (True, "Final "), (False, "answer."), (True, "Final answer."),
    ]
    # A reconnecting client sees only the current round, not earlier drafts.
    assert [(e["reset"], e["text"]) for e in late_events] == [
        (True, "Round two."), (True, "Final "), (False, "answer."), (True, "Final answer."),
    ]
    assert late_events[-1]["status"] == "completed"


@pytest.mark.asyncio
async def test_reasoning_stays_active_through_tools_and_answer_until_reply_finishes(monkeypatch):
    clock = iter([10.0, 12.0])
    monkeypatch.setattr(chat_runtime, "time", SimpleNamespace(monotonic=lambda: next(clock)))
    reply = Reply("alice", "s1", "t1")
    live = asyncio.create_task(_collect(reply))
    await asyncio.sleep(0.1)
    reply.append_reasoning("Step one. ")
    await asyncio.sleep(0.1)
    reply.append_reasoning("Step two.")
    await asyncio.sleep(0.1)
    late = asyncio.create_task(_collect(reply))
    await asyncio.sleep(0.1)
    reply.progress({"status": "running", "name": "search_wiki"})
    reply.append("Provisional answer")
    await asyncio.sleep(0.1)
    reply.reset()
    reply.append_reasoning("\n\nAnother round")
    await asyncio.sleep(0.1)
    reply.append("Answer")
    await asyncio.sleep(0.1)
    reply.finish("completed", None)
    live_events, late_events = await asyncio.gather(live, late)

    assert [e["reasoning"] for e in live_events if e["reasoning"]] == [
        "Step one. ", "Step two.", "\n\nAnother round", "Step one. Step two.\n\nAnother round",
    ]
    assert late_events[0]["reasoning"] == "Step one. Step two."
    assert late_events[0]["reasoning_reset"] is True
    assert all(e["reasoning_active"] and e["reasoning_seconds"] == 0 for e in live_events[:-1])
    assert live_events[-1]["reasoning_active"] is False
    assert live_events[-1]["reasoning_seconds"] == 2.0
    assert live_events[-1]["text"] == "Answer"
