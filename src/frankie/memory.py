"""SQLite 存储模块：对话历史、个人记忆、公共记忆。"""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from frankie.config import get_vault_ctx as _ctx
from frankie.tool_xml import strip_tool_xml


SQL_INIT = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT,
    topic TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    message_count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS personal_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    source TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS public_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    source TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


@dataclass(frozen=True)
class MemoryEntry:
    id: int
    title: str
    content: str
    tags: list[str]
    source: str | None
    created_at: str
    updated_at: str
    created_by: str | None = None
    user_id: str | None = None


def _memory_db_path() -> Path:
    path = _ctx().frankie_dir / "memory.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def _db_connection() -> sqlite3.Connection:
    path = _memory_db_path()
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SQL_INIT)
        _migrate(conn)
        yield conn
    finally:
        conn.commit()
        conn.close()


def _migrate(conn: sqlite3.Connection) -> None:
    """为旧库补齐新增列（幂等）。"""
    try:
        conn.execute("ALTER TABLE messages ADD COLUMN attachments TEXT")
    except sqlite3.OperationalError:
        pass  # 列已存在


def _serialize_tags(tags: list[str] | None) -> str | None:
    return json.dumps(tags, ensure_ascii=False) if tags else None


def _deserialize_tags(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        data = json.loads(value)
        return list(data) if isinstance(data, (list, tuple)) else []
    except Exception:
        return []


def _now() -> str:
    return datetime.now().isoformat()


def _normalize_session_id(session_id: str | None) -> str:
    return session_id.strip() if session_id and session_id.strip() else uuid.uuid4().hex

def _clean_tool_xml(text: str) -> str:
    """Remove leaked tool-call XML from stored/loaded message content."""
    if not text:
        return text
    text = strip_tool_xml(text)
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    return text.strip()


def save_session_history(
    session_id: str | None,
    history: list[dict[str, str]],
    *,
    topic: str | None = None,
    user_id: str | None = None,
) -> str:
    """保存整段对话历史到 SQLite 会话表。"""
    session_id = _normalize_session_id(session_id)
    now = _now()
    message_count = len(history)

    with _db_connection() as conn:
        existing = conn.execute(
            "SELECT created_at, user_id FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        if existing is not None and existing["user_id"] not in (None, user_id):
            raise ValueError("Session belongs to another user")
        if existing is None:
            created_at = now
            conn.execute(
                "INSERT INTO sessions (session_id, user_id, topic, created_at, updated_at, message_count) VALUES (?, ?, ?, ?, ?, ?)",
                (session_id, user_id, topic, created_at, now, message_count),
            )
        else:
            conn.execute(
                "UPDATE sessions SET topic = ?, updated_at = ?, message_count = ? WHERE session_id = ?",
                (topic, now, message_count, session_id),
            )
            conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))

        for msg in history:
            attachments = msg.get("attachments") or []
            attachments_json = json.dumps(attachments, ensure_ascii=False) if attachments else None
            conn.execute(
                "INSERT INTO messages (session_id, role, content, attachments, created_at) VALUES (?, ?, ?, ?, ?)",
                (session_id, msg.get("role", "user"), _clean_tool_xml(msg.get("content", "")), attachments_json, now),
            )
    return session_id


def rename_session(session_id: str, topic: str, *, user_id: str) -> bool:
    with _db_connection() as conn:
        cursor = conn.execute(
            "UPDATE sessions SET topic = ? WHERE session_id = ? AND user_id = ?",
            (topic.strip() or "新会话", session_id, user_id),
        )
    return cursor.rowcount > 0


def delete_session(session_id: str, *, user_id: str) -> bool:
    with _db_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM sessions WHERE session_id = ? AND user_id = ?",
            (session_id, user_id),
        )
    return cursor.rowcount > 0


def list_sessions(limit: int = 20, user_id: str | None = None) -> list[dict[str, Any]]:
    where = " WHERE user_id = ?" if user_id else ""
    params: list[Any] = [user_id] if user_id else []
    params.append(limit)
    with _db_connection() as conn:
        rows = conn.execute(
            f"SELECT session_id, topic, created_at, updated_at, message_count FROM sessions{where} ORDER BY updated_at DESC LIMIT ?",
            params,
        ).fetchall()
    return [dict(row) for row in rows]


def load_session(session_id: str) -> dict[str, Any] | None:
    with _db_connection() as conn:
        session = conn.execute(
            "SELECT session_id, user_id, topic, created_at, updated_at, message_count FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        if session is None:
            return None
        rows = conn.execute(
            "SELECT role, content, attachments, created_at FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        ).fetchall()
        messages = []
        for row in rows:
            msg = dict(row)
            msg["content"] = _clean_tool_xml(msg.get("content", ""))
            attachments = msg.get("attachments")
            try:
                msg["attachments"] = json.loads(attachments) if attachments else []
            except ValueError:
                msg["attachments"] = []
            messages.append(msg)
    return {**dict(session), "messages": messages}


def save_personal_memory(
    title: str,
    content: str,
    *,
    tags: list[str] | None = None,
    source: str | None = None,
    user_id: str | None = None,
) -> int:
    now = _now()
    with _db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO personal_memory (user_id, title, content, tags, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, title, content, _serialize_tags(tags), source, now, now),
        )
    return cursor.lastrowid


def list_personal_memory(query: str | None = None, limit: int = 20) -> list[MemoryEntry]:
    sql = "SELECT * FROM personal_memory"
    params: list[Any] = []
    if query:
        sql += " WHERE title LIKE ? OR content LIKE ?"
        term = f"%{query}%"
        params = [term, term]
    sql += " ORDER BY updated_at DESC LIMIT ?"
    params.append(limit)

    with _db_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [MemoryEntry(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        tags=_deserialize_tags(row["tags"]),
        source=row["source"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        user_id=row["user_id"],
        created_by=None,
    ) for row in rows]


def save_public_memory(
    title: str,
    content: str,
    *,
    tags: list[str] | None = None,
    source: str | None = None,
    created_by: str | None = None,
) -> int:
    now = _now()
    with _db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO public_memory (title, content, tags, source, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (title, content, _serialize_tags(tags), source, created_by, now, now),
        )
    return cursor.lastrowid


def list_public_memory(query: str | None = None, limit: int = 20) -> list[MemoryEntry]:
    sql = "SELECT * FROM public_memory"
    params: list[Any] = []
    if query:
        sql += " WHERE title LIKE ? OR content LIKE ?"
        term = f"%{query}%"
        params = [term, term]
    sql += " ORDER BY updated_at DESC LIMIT ?"
    params.append(limit)

    with _db_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [MemoryEntry(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        tags=_deserialize_tags(row["tags"]),
        source=row["source"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=row["created_by"],
        user_id=None,
    ) for row in rows]


def load_memory_context(max_public: int = 3, max_personal: int = 3) -> str:
    public_entries = list_public_memory(limit=max_public)
    personal_entries = list_personal_memory(limit=max_personal)
    parts: list[str] = []

    if public_entries:
        parts.append("【公共记忆】")
        for entry in public_entries:
            parts.append(f"- {entry.title}: {entry.content}")
    if personal_entries:
        parts.append("【个人记忆】")
        for entry in personal_entries:
            parts.append(f"- {entry.title}: {entry.content}")
    return "\n".join(parts)
