"""SQLite 存储模块：对话历史。"""

from __future__ import annotations

import json
import logging
import sqlite3
import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from frankie.attachments import stored_attachment_path
from frankie.config import get_vault_ctx as _ctx

logger = logging.getLogger(__name__)

SQL_INIT = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    thinking_level TEXT NOT NULL DEFAULT 'off'
        CHECK(thinking_level IN ('off', 'low', 'high', 'max')),
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
        session_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(chat_sessions)")
        }
        if "thinking_level" not in session_columns:
            conn.execute(
                """ALTER TABLE chat_sessions ADD COLUMN thinking_level TEXT NOT NULL
                DEFAULT 'off' CHECK(thinking_level IN ('off', 'low', 'high', 'max'))"""
            )
            conn.commit()
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
            """SELECT session_id, user_id, topic, thinking_level,
                created_at, updated_at, message_count
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


_TERMINAL_TURN_STATUSES = {"completed", "failed", "cancelled"}


class ActiveChatTurnError(RuntimeError):
    """Raised when deletion would race with an active chat generation."""


def cancel_orphaned_turns() -> None:
    """Called at server startup, before any producers or requests exist."""
    with _db_connection() as conn:
        conn.execute(
            """UPDATE chat_turns SET status = 'cancelled', finished_at = ?
            WHERE status = 'running'""",
            (_now(),),
        )


def begin_chat_turn(
    session_id: str | None,
    *,
    user_id: str,
    user_text: str,
    attachments: list[dict[str, Any]],
    thinking_level: str = "off",
    edit_turn_id: str | None = None,
) -> dict[str, Any]:
    """Create a running turn and return context from all finished preceding turns.

    When edit_turn_id is given, that turn (the resent question) and every turn
    after it are deleted in the same transaction before the new turn is inserted.
    """
    if thinking_level not in {"off", "low", "high", "max"}:
        raise ValueError("Invalid thinking level")
    requested_session_id = session_id
    normalized_session_id = _normalize_session_id(session_id)
    now = _now()
    deleted_count = 0
    orphaned_attachments: list[dict[str, Any]] = []

    with _db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        session = conn.execute(
            "SELECT user_id, topic, thinking_level FROM chat_sessions WHERE session_id = ?",
            (normalized_session_id,),
        ).fetchone()

        if session is None:
            if edit_turn_id is not None or (requested_session_id is not None and requested_session_id.strip()):
                raise LookupError("Chat session not found")
            topic = user_text[:24] or "新会话"
            conn.execute(
                """
                INSERT INTO chat_sessions
                    (session_id, user_id, topic, thinking_level,
                     created_at, updated_at, message_count)
                VALUES (?, ?, ?, ?, ?, ?, 0)
                """,
                (normalized_session_id, user_id, topic, thinking_level, now, now),
            )
        else:
            if session["user_id"] != user_id:
                raise PermissionError("Chat session belongs to another user")
            topic = session["topic"]
            active = conn.execute(
                "SELECT 1 FROM chat_turns WHERE session_id = ? AND status = 'running'",
                (normalized_session_id,),
            ).fetchone()
            if active is not None:
                raise RuntimeError("Chat session already has a running turn")
            if edit_turn_id is not None:
                target = conn.execute(
                    "SELECT rowid FROM chat_turns WHERE session_id = ? AND turn_id = ?",
                    (normalized_session_id, edit_turn_id),
                ).fetchone()
                if target is None:
                    raise LookupError("Chat turn not found")
                deleted_rows = conn.execute(
                    "SELECT attachments_json FROM chat_turns WHERE session_id = ? AND rowid >= ?",
                    (normalized_session_id, target["rowid"]),
                ).fetchall()
                cursor = conn.execute(
                    "DELETE FROM chat_turns WHERE session_id = ? AND rowid >= ?",
                    (normalized_session_id, target["rowid"]),
                )
                deleted_count = cursor.rowcount
                orphaned_attachments = [
                    attachment
                    for row in deleted_rows
                    for attachment in json.loads(row["attachments_json"])
                ]
            if session["thinking_level"] != thinking_level:
                conn.execute(
                    "UPDATE chat_sessions SET thinking_level = ? WHERE session_id = ?",
                    (thinking_level, normalized_session_id),
                )

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
            SET updated_at = ?, message_count = message_count + ?
            WHERE session_id = ?
            """,
            (now, 2 - 2 * deleted_count, normalized_session_id),
        )

    # Files of discarded turns are never referenced again; each upload has a unique name.
    orphan_paths: set[Path] = set()
    for attachment in orphaned_attachments:
        try:
            orphan_paths.add(stored_attachment_path(_ctx().root, attachment["id"]))
        except ValueError:
            logger.exception("Discarded turn carries an unexpected attachment name: %s", attachment.get("id"))
    for path in orphan_paths:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Failed to delete attachment %s", path.name)

    return {
        "session_id": normalized_session_id,
        "turn_id": turn_id,
        "topic": topic,
        "thinking_level": thinking_level,
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


def update_session_thinking(
    session_id: str, thinking_level: str, *, user_id: str,
) -> bool:
    if thinking_level not in {"off", "low", "high", "max"}:
        raise ValueError("Invalid thinking level")
    with _db_connection() as conn:
        cursor = conn.execute(
            """UPDATE chat_sessions SET thinking_level = ?
            WHERE session_id = ? AND user_id = ?""",
            (thinking_level, session_id, user_id),
        )
    return cursor.rowcount > 0


def delete_session(session_id: str, *, user_id: str) -> bool:
    with _db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        session = conn.execute(
            "SELECT 1 FROM chat_sessions WHERE session_id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
        if session is None:
            return False
        if conn.execute(
            "SELECT 1 FROM chat_turns WHERE session_id = ? AND status = 'running'",
            (session_id,),
        ).fetchone() is not None:
            raise ActiveChatTurnError("Chat session still has a running turn")
        rows = conn.execute(
            "SELECT attachments_json FROM chat_turns WHERE session_id = ?",
            (session_id,),
        ).fetchall()
        paths = [
            stored_attachment_path(_ctx().root, attachment["id"])
            for row in rows
            for attachment in json.loads(row["attachments_json"])
        ]
        conn.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))

    for path in dict.fromkeys(paths):
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Failed to delete attachment %s", path.name)
    return True


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
    with _db_connection() as conn:
        conn.execute("BEGIN")
        session = conn.execute(
            """
            SELECT session_id, user_id, topic, thinking_level,
                created_at, updated_at, message_count
            FROM chat_sessions
            WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()
        if session is None:
            return None

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
                    "turn_id": turn_id,
                    "role": "user",
                    "content": row["user_text"],
                    "attachments": json.loads(row["attachments_json"]),
                    "status": "completed",
                }
            )
            messages.append(
                {
                    "id": f"a-{turn_id}",
                    "turn_id": turn_id,
                    "role": "assistant",
                    "content": row["assistant_text"],
                    "attachments": [],
                    "status": row["status"],
                    "error": row["error"],
                }
            )
    return {**dict(session), "messages": messages}
