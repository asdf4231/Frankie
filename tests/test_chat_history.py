from __future__ import annotations

import pytest

from frankie import memory


@pytest.fixture
def isolated_memory_db(tmp_path, monkeypatch):
    db_path = tmp_path / "memory.db"
    monkeypatch.setattr(memory, "_memory_db_path", lambda: db_path)
    return db_path


def test_structured_history_and_attachments_round_trip_without_cleanup(isolated_memory_db):
    user_text = '请保留截图片段 <screenshot id="shot-1">\n\n\n和 XML <tool_call>raw</tool_call>'
    user_content = [
        {"type": "text", "text": user_text},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KGgo="}},
    ]
    attachments = [
        {"id": "0123456789abcdef0123456789abcdef.png", "name": "screen.png"}
    ]

    started = memory.begin_chat_turn(
        None,
        user_id="alice",
        user_text=user_text,
        attachments=attachments,
    )
    assert started["topic"] == user_text[:24]
    assert started["history"] == []

    provider_messages = [
        {"role": "user", "content": user_content},
        {
            "role": "assistant",
            "content": "先检查 <tool_call>不要清理</tool_call>",
            "reasoning_content": "internal provider metadata",
            "tool_calls": [{
                "id": "call_exact_01", "type": "function",
                "function": {"name": "read_wiki_page", "arguments": '{"path":"bellman.md"}'},
            }],
        },
        {"role": "tool", "tool_call_id": "call_exact_01", "content": "页面内容"},
        {"role": "assistant", "content": "结论"},
    ]
    assistant_text = '<screenshot id="shot-1">回答</screenshot>\n\n\n<tool_call>raw</tool_call>'
    memory.finish_chat_turn(
        started["turn_id"],
        messages=provider_messages,
        assistant_text=assistant_text,
        status="completed",
    )

    loaded = memory.load_session(started["session_id"])
    assert loaded is not None
    assert loaded["user_id"] == "alice"
    assert loaded["messages"] == [
        {
            "id": f'u-{started["turn_id"]}',
            "role": "user",
            "content": user_text,
            "attachments": attachments,
            "status": "completed",
        },
        {
            "id": f'a-{started["turn_id"]}',
            "role": "assistant",
            "content": assistant_text,
            "attachments": [],
            "status": "completed",
            "error": None,
        },
    ]

    next_turn = memory.begin_chat_turn(
        started["session_id"],
        user_id="alice",
        user_text="下一问",
        attachments=[],
    )
    assert next_turn["history"] == provider_messages


@pytest.mark.parametrize("status, partial", [("failed", ""), ("cancelled", "中断前的回答 <sup>2</sup>")])
def test_ownership_and_interrupted_turn_replay(isolated_memory_db, status, partial):
    first = memory.begin_chat_turn(
        None,
        user_id="alice",
        user_text="会失败的问题",
        attachments=[],
    )

    with pytest.raises(PermissionError):
        memory.begin_chat_turn(
            first["session_id"],
            user_id="bob",
            user_text="越权",
            attachments=[],
        )
    with pytest.raises(RuntimeError):
        memory.begin_chat_turn(
            first["session_id"],
            user_id="alice",
            user_text="并发请求",
            attachments=[],
        )

    memory.finish_chat_turn(
        first["turn_id"],
        messages=[
            {"role": "user", "content": "会失败的问题"},
            {"role": "assistant", "content": "", "tool_calls": [{
                "id": "unfinished", "type": "function",
                "function": {"name": "list_topics", "arguments": "{}"},
            }]},
        ],
        assistant_text=partial,
        status=status,
        error="provider disconnected" if status == "failed" else None,
    )
    loaded = memory.load_session(first["session_id"])
    assert loaded is not None
    assert loaded["messages"][1] == {
        "id": f'a-{first["turn_id"]}',
        "role": "assistant",
        "content": partial,
        "attachments": [],
        "status": status,
        "error": "provider disconnected" if status == "failed" else None,
    }

    next_turn = memory.begin_chat_turn(
        first["session_id"],
        user_id="alice",
        user_text="失败后的新问题",
        attachments=[],
    )
    expected = [{"role": "user", "content": "会失败的问题"}]
    if partial:
        expected.append({"role": "assistant", "content": partial})
    assert next_turn["history"] == expected


def test_saved_text_is_replayed_without_a_provider_transcript(isolated_memory_db):
    first = memory.begin_chat_turn(None, user_id="alice", user_text="请推导公式", attachments=[])
    # Existing interrupted records can contain visible text but no transcript.
    with memory._db_connection() as conn:
        conn.execute(
            "UPDATE chat_turns SET status = 'cancelled', assistant_text = ? WHERE turn_id = ?",
            ("推导第一步", first["turn_id"]),
        )
    next_turn = memory.begin_chat_turn(first["session_id"], user_id="alice", user_text="继续", attachments=[])
    assert next_turn["history"] == [
        {"role": "user", "content": "请推导公式"},
        {"role": "assistant", "content": "推导第一步"},
    ]
