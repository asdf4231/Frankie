"""SQLite 存储模块：对话历史。"""

from __future__ import annotations

import json
import sqlite3
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from frankie.config import get_vault_ctx as _ctx

SQL_INIT = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS chat_turns (
    turn_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_text TEXT NOT NULL,
    attachments_json TEXT NOT NULL,
    provider_messages_json TEXT,
    assistant_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
    error TEXT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS chat_turns_session_started
    ON chat_turns(session_id, started_at);
"""


def _memory_db_path() -> Path:
    path = _ctx().require_writable() / "memory.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def _db_connection() -> Iterator[sqlite3.Connection]:
    path = _memory_db_path()
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SQL_INIT)
        yield conn
    except Exception:
        conn.rollback()
        raise
    else:
        conn.commit()
    finally:
        conn.close()


def initialize_history() -> None:
    """Initialize and validate this account's history without changing saved turns."""
    with _db_connection() as conn:
        conn.execute(
            """SELECT session_id, user_id, topic, created_at, updated_at, message_count
            FROM chat_sessions LIMIT 0"""
        )
        conn.execute(
            """SELECT turn_id, session_id, user_text, attachments_json,
                provider_messages_json, assistant_text, status, error, started_at, finished_at
            FROM chat_turns LIMIT 0"""
        )


def _now() -> str:
    return datetime.now().isoformat()


def _normalize_session_id(session_id: str | None) -> str:
    return session_id.strip() if session_id and session_id.strip() else uuid.uuid4().hex


_CHAT_TURN_LEASE_SECONDS = 300
_TERMINAL_TURN_STATUSES = {"completed", "failed", "cancelled"}


def _expire_stale_turns(
    conn: sqlite3.Connection,
    session_id: str,
    *,
    now: datetime,
) -> None:
    cutoff = (now - timedelta(seconds=_CHAT_TURN_LEASE_SECONDS)).isoformat()
    conn.execute(
        """
        UPDATE chat_turns
        SET status = 'cancelled',
            error = COALESCE(error, 'Chat generation lease expired'),
            finished_at = ?
        WHERE session_id = ? AND status = 'running' AND started_at <= ?
        """,
        (now.isoformat(), session_id, cutoff),
    )


def begin_chat_turn(
    session_id: str | None,
    *,
    user_id: str,
    user_text: str,
    attachments: list[dict[str, Any]],
) -> dict[str, Any]:
    """Create a running turn and return context from all finished preceding turns."""
    requested_session_id = session_id
    normalized_session_id = _normalize_session_id(session_id)
    now_dt = datetime.now()
    now = now_dt.isoformat()

    with _db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        session = conn.execute(
            "SELECT user_id, topic FROM chat_sessions WHERE session_id = ?",
            (normalized_session_id,),
        ).fetchone()

        if session is None:
            if requested_session_id is not None and requested_session_id.strip():
                raise LookupError("Chat session not found")
            topic = user_text[:24] or "新会话"
            conn.execute(
                """
                INSERT INTO chat_sessions
                    (session_id, user_id, topic, created_at, updated_at, message_count)
                VALUES (?, ?, ?, ?, ?, 0)
                """,
                (normalized_session_id, user_id, topic, now, now),
            )
        else:
            if session["user_id"] != user_id:
                raise PermissionError("Chat session belongs to another user")
            topic = session["topic"]
            _expire_stale_turns(conn, normalized_session_id, now=now_dt)
            active = conn.execute(
                "SELECT 1 FROM chat_turns WHERE session_id = ? AND status = 'running'",
                (normalized_session_id,),
            ).fetchone()
            if active is not None:
                raise RuntimeError("Chat session already has a running turn")

        rows = conn.execute(
            """
            SELECT provider_messages_json, user_text, assistant_text
            FROM chat_turns
            WHERE session_id = ? AND status != 'running'
            ORDER BY started_at, rowid
            """,
            (normalized_session_id,),
        ).fetchall()
        history: list[dict[str, Any]] = []
        for row in rows:
            if row["provider_messages_json"] is not None:
                history.extend(json.loads(row["provider_messages_json"]))
            else:
                # Interrupted records without a transcript still have visible text.
                history.append({"role": "user", "content": row["user_text"]})
                if row["assistant_text"]:
                    history.append({"role": "assistant", "content": row["assistant_text"]})

        turn_id = uuid.uuid4().hex
        conn.execute(
            """
            INSERT INTO chat_turns
                (turn_id, session_id, user_text, attachments_json, status, started_at)
            VALUES (?, ?, ?, ?, 'running', ?)
            """,
            (
                turn_id,
                normalized_session_id,
                user_text,
                json.dumps(attachments, ensure_ascii=False),
                now,
            ),
        )
        conn.execute(
            """
            UPDATE chat_sessions
            SET updated_at = ?, message_count = message_count + 2
            WHERE session_id = ?
            """,
            (now, normalized_session_id),
        )

    return {
        "session_id": normalized_session_id,
        "turn_id": turn_id,
        "topic": topic,
        "history": history,
    }


def finish_chat_turn(
    turn_id: str,
    *,
    messages: list[dict[str, Any]],
    assistant_text: str,
    status: str,
    error: str | None = None,
) -> None:
    """Save a turn; interrupted turns replay their user input and visible reply only."""
    if status not in _TERMINAL_TURN_STATUSES:
        raise ValueError("Turn status must be completed, failed, or cancelled")

    now = _now()
    with _db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        turn = conn.execute(
            "SELECT session_id, status, user_text FROM chat_turns WHERE turn_id = ?",
            (turn_id,),
        ).fetchone()
        if turn is None:
            raise LookupError("Chat turn not found")
        if turn["status"] != "running":
            raise RuntimeError("Chat turn is already finished")

        if status != "completed":
            # Keep the user's full input (including attachments) and the text
            # shown in chat, but never replay an unfinished tool transaction.
            user_content = messages[0]["content"] if messages else turn["user_text"]
            messages = [{"role": "user", "content": user_content}]
            if assistant_text:
                messages.append({"role": "assistant", "content": assistant_text})
        provider_messages_json = json.dumps(messages, ensure_ascii=False)
        conn.execute(
            """
            UPDATE chat_turns
            SET provider_messages_json = ?, assistant_text = ?, status = ?,
                error = ?, finished_at = ?
            WHERE turn_id = ?
            """,
            (provider_messages_json, assistant_text, status, error, now, turn_id),
        )
        conn.execute(
            "UPDATE chat_sessions SET updated_at = ? WHERE session_id = ?",
            (now, turn["session_id"]),
        )


def rename_session(session_id: str, topic: str, *, user_id: str) -> bool:
    with _db_connection() as conn:
        cursor = conn.execute(
            "UPDATE chat_sessions SET topic = ? WHERE session_id = ? AND user_id = ?",
            (topic.strip() or "新会话", session_id, user_id),
        )
    return cursor.rowcount > 0


def delete_session(session_id: str, *, user_id: str) -> bool:
    with _db_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?",
            (session_id, user_id),
        )
    return cursor.rowcount > 0


def list_sessions(limit: int = 20, user_id: str | None = None) -> list[dict[str, Any]]:
    where = " WHERE user_id = ?" if user_id is not None else ""
    params: list[Any] = [user_id] if user_id is not None else []
    params.append(limit)
    with _db_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT session_id, topic, created_at, updated_at, message_count
            FROM chat_sessions{where}
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            params,
        ).fetchall()
    return [dict(row) for row in rows]


def load_session(session_id: str) -> dict[str, Any] | None:
    now_dt = datetime.now()
    with _db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        session = conn.execute(
            """
            SELECT session_id, user_id, topic, created_at, updated_at, message_count
            FROM chat_sessions
            WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()
        if session is None:
            return None

        _expire_stale_turns(conn, session_id, now=now_dt)
        rows = conn.execute(
            """
            SELECT turn_id, user_text, attachments_json, assistant_text, status, error
            FROM chat_turns
            WHERE session_id = ?
            ORDER BY started_at, rowid
            """,
            (session_id,),
        ).fetchall()
        messages: list[dict[str, Any]] = []
        for row in rows:
            turn_id = row["turn_id"]
            messages.append(
                {
                    "id": f"u-{turn_id}",
                    "role": "user",
                    "content": row["user_text"],
                    "attachments": json.loads(row["attachments_json"]),
                    "status": "completed",
                }
            )
            messages.append(
                {
                    "id": f"a-{turn_id}",
                    "role": "assistant",
                    "content": row["assistant_text"],
                    "attachments": [],
                    "status": row["status"],
                    "error": row["error"],
                }
            )
    return {**dict(session), "messages": messages}
