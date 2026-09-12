"""Admin-only history browsing and durable incremental class analysis."""

import asyncio
from datetime import datetime, timedelta

import httpx
import pytest

from frankie import auth, learning, llm, memory, web
from frankie.config import use_vault_ctx


@pytest.fixture
def classroom(tmp_path, monkeypatch):
    monkeypatch.setattr(auth.settings, "frankie_data_dir", tmp_path)
    auth._save_auth_store({"users": {
        "alice": {"display_name": "Alice", "password_hash": "SECRET"},
        "bob": {"role": "student"},
        "empty": {"role": "student"},
        "teacher": {"role": "admin"},
    }})
    monkeypatch.setattr(learning, "append_token_log", lambda *args: None)
    monkeypatch.setattr(learning, "_summary_lock", asyncio.Lock())
    return tmp_path


def question(user_id, text, *, when=None, status="completed", session_id=None):
    with use_vault_ctx(auth.user_vault_ctx(user_id)):
        turn = memory.begin_chat_turn(session_id, user_id=user_id, user_text=text, attachments=[])
        if status != "running":
            memory.finish_chat_turn(
                turn["turn_id"], messages=[{"role": "user", "content": text}],
                assistant_text="ANSWER_MUST_NOT_ENTER_SUMMARY", status=status,
            )
        if when is not None:
            with memory._db_connection() as conn:
                conn.execute("UPDATE chat_turns SET started_at = ? WHERE turn_id = ?", (when, turn["turn_id"]))
    return turn


@pytest.mark.asyncio
async def test_incremental_saved_reports_have_no_answers_or_admin_questions(classroom, monkeypatch):
    question("alice", "Bellman 的边界条件是什么？", status="running")
    question("teacher", "ADMIN_QUESTION")
    calls = []

    async def summarize(system, messages, **kwargs):
        calls.append((system, messages))
        # This arrives AFTER the generation's snapshot cutoff and must be picked
        # up by the next report, even though it precedes the saved created_at.
        if len(calls) == 1:
            question("bob", "为什么需要横截条件？", status="failed")
        return "## 共性问题\n边界条件需要进一步讨论。", llm.TokenUsage(3, 4, "fake")

    monkeypatch.setattr(llm, "chat", summarize)
    first = await learning.generate_summary()
    assert first["question_count"] == first["student_count"] == 1
    assert first["window_start"] is None
    assert first["window_end"] <= first["created_at"]
    assert "Bellman" in str(calls[0])
    assert "ANSWER_MUST_NOT_ENTER_SUMMARY" not in str(calls)
    assert "ADMIN_QUESTION" not in str(calls)
    assert "alice" not in str(calls)
    assert learning.saved_summaries() == [first]
    assert len(list((classroom / "admin" / "summaries").glob("*.md"))) == 1

    second = await learning.generate_summary()
    assert second["window_start"] == first["window_end"]
    assert second["question_count"] == second["student_count"] == 1
    assert "横截条件" in str(calls[1])
    assert "Bellman" not in str(calls[1])
    assert learning.saved_summaries() == [second, first]
    with pytest.raises(learning.NoNewQuestions):
        await learning.generate_summary()
    assert len(calls) == 2
    assert learning.saved_summaries() == [second, first]


@pytest.mark.asyncio
async def test_failure_and_cancellation_do_not_advance_cutoff(classroom, monkeypatch):
    question("alice", "需要保留的问题")

    async def fail(*args, **kwargs):
        raise llm.ProtocolError("truncated")

    monkeypatch.setattr(llm, "chat", fail)
    with pytest.raises(llm.ProtocolError):
        await learning.generate_summary()
    assert learning.saved_summaries() == []
    assert not learning._summary_lock.locked()

    started = asyncio.Event()
    release = asyncio.Event()

    async def wait(*args, **kwargs):
        started.set()
        await release.wait()
        return "报告", llm.TokenUsage.zero()

    monkeypatch.setattr(llm, "chat", wait)
    task = asyncio.create_task(learning.generate_summary())
    await started.wait()
    with pytest.raises(learning.SummaryBusy):
        await learning.generate_summary()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert not learning._summary_lock.locked()
    assert learning.saved_summaries() == []
    release.set()
    report = await learning.generate_summary()
    assert report["question_count"] == 1
    assert report["window_start"] is None


@pytest.mark.asyncio
async def test_failed_publication_keeps_previous_checkpoint(classroom, monkeypatch):
    from pathlib import Path

    question("alice", "首次问题")

    async def summarize(*args, **kwargs):
        return "报告", llm.TokenUsage.zero()

    monkeypatch.setattr(llm, "chat", summarize)
    first = await learning.generate_summary()
    question("bob", "后续问题")
    original_replace = Path.replace

    def fail_replace(*args, **kwargs):
        raise OSError("disk error")

    monkeypatch.setattr(Path, "replace", fail_replace)
    with pytest.raises(OSError):
        await learning.generate_summary()
    assert learning.saved_summaries() == [first]
    assert not list((classroom / "admin" / "summaries").glob("*.tmp"))
    monkeypatch.setattr(Path, "replace", original_replace)
    second = await learning.generate_summary()
    assert second["window_start"] == first["window_end"]
    assert second["question_count"] == 1


def test_read_only_browsing_and_question_window_boundaries(classroom):
    cutoff = datetime.now().isoformat()
    turn = question("alice", "原始提问", when=cutoff, status="running")
    db = auth.user_vault_ctx("alice").require_writable() / "memory.db"
    before = db.read_bytes()
    stats = learning.student_overview()
    assert len(stats) == 3
    assert "SECRET" not in str(stats)
    assert next(s for s in stats if s["user_id"] == "alice")["question_count"] == 1
    assert learning.student_sessions("alice")[0]["session_id"] == turn["session_id"]
    saved = learning.student_session("alice", turn["session_id"])
    assert saved["turns"][0]["status"] == "running"
    assert saved["turns"][0]["user_text"] == "原始提问"
    assert db.read_bytes() == before
    assert learning.student_sessions("empty") == []
    assert not (classroom / "users" / "empty").exists()
    assert len(learning._questions(None, cutoff)) == 1
    assert learning._questions(cutoff, (datetime.now() + timedelta(seconds=1)).isoformat()) == []
    with pytest.raises(LookupError):
        learning.student_session("bob", turn["session_id"])
    with pytest.raises(LookupError):
        learning.student_sessions("teacher")
    with pytest.raises(LookupError):
        learning.student_sessions("../alice")


def test_session_pagination(classroom):
    for index in range(51):
        question("alice", f"问题 {index}")
    first = learning.student_sessions("alice")
    second = learning.student_sessions("alice", 50)
    assert len(first) == 50
    assert len(second) == 1
    assert {s["session_id"] for s in first}.isdisjoint(s["session_id"] for s in second)


@pytest.mark.asyncio
@pytest.mark.parametrize("role,code", [(None, 401), ("student", 403), ("admin", 200)])
async def test_all_admin_routes_are_protected(classroom, role, code):
    turn = question("alice", "学生问题")
    name = "a" * 32 + ".png"
    attachments = classroom / "users" / "alice" / "attachments"
    attachments.mkdir()
    (attachments / name).write_bytes(b"image")
    if role:
        async def current_user():
            return auth.UserIdentity("teacher" if role == "admin" else "alice", role=role)
        web.app.dependency_overrides[web.get_current_user] = current_user
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=web.app), base_url="http://test") as client:
            routes = [
                "/api/admin/students", "/api/admin/students/alice/sessions",
                f"/api/admin/students/alice/sessions/{turn['session_id']}",
                f"/api/admin/students/alice/attachments/{name}", "/api/admin/summaries",
            ]
            for route in routes:
                response = await client.get(route)
                assert response.status_code == code, (route, response.text)
            # No LLM call needed to verify the POST dependency: the lock makes
            # authorized requests report 409, others must be rejected first.
            async with learning._summary_lock:
                response = await client.post("/api/admin/summaries")
            assert response.status_code == (409 if role == "admin" else code)
            if role == "admin":
                assert (await client.get("/api/admin/students/alice/sessions?offset=-1")).status_code == 422
                assert (await client.get(f"/api/admin/students/bob/sessions/{turn['session_id']}")).status_code == 404
                assert (await client.get("/api/admin/students/unknown/sessions")).status_code == 404
                (attachments / name).unlink()
                (attachments / name).symlink_to(classroom / "auth" / "users.json")
                assert (await client.get(routes[3])).status_code == 404
    finally:
        web.app.dependency_overrides.pop(web.get_current_user, None)


def test_student_database_symlinks_are_not_followed(classroom):
    question("alice", "隔离数据")
    (classroom / "users" / "bob").symlink_to(classroom / "users" / "alice", target_is_directory=True)
    with pytest.raises(LookupError):
        learning.student_sessions("bob")


@pytest.mark.asyncio
async def test_long_inputs_are_batched_without_discarding_tail(classroom, monkeypatch):
    question("alice", "x" * (learning._BATCH_CHARS * 2) + "TAIL_EVIDENCE")
    calls = []

    async def summarize(system, messages, **kwargs):
        calls.append(messages[0]["content"])
        return "分批报告", llm.TokenUsage.zero()

    monkeypatch.setattr(llm, "chat", summarize)
    report = await learning.generate_summary()
    assert report["question_count"] == 1
    assert len(calls) == 4  # Three input parts, then one synthesis.
    assert all(len(part) <= learning._BATCH_CHARS for part in calls)
    assert any("TAIL_EVIDENCE" in part for part in calls)
    assert "分批报告" in calls[-1]
