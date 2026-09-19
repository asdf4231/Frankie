import asyncio

import pytest

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
