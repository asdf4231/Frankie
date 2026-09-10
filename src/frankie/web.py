"""Frankie Web 后端（FastAPI）。

职责：将 agent.py 的核心能力暴露为 HTTP/SSE 接口，
      托管 frontend/dist/ 静态文件（生产模式）。

启动方式：
    frankie web              # CLI 命令（pyproject.toml 注册）
    uvicorn frankie.web:app  # 直接启动（开发调试）

端口默认 7860，可通过 --port 参数覆盖。
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from collections.abc import AsyncGenerator
from contextlib import aclosing
from pathlib import Path
from urllib.parse import unquote, urlparse

import anyio
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.types import Send

from frankie.agent import _load_wiki_index
from frankie.auth import (
    SESSION_COOKIE_NAME,
    InvalidUserIdError,
    UserIdentity,
    _get_user_record,
    authenticate_user,
    ensure_user_dirs,
    make_session_token,
    resolve_user,
    set_user_password,
    shared_vault_ctx,
    user_vault_ctx,
)
from frankie.config import (
    VaultContext,
    get_vault_ctx,
    hidden_content_dirs,
    set_vault_ctx,
    settings,
    use_vault_ctx,
)
from frankie.content import (
    answer_context,
    is_hidden_admin_path,
    list_admin_files,
    read_admin_file,
    write_admin_file,
)
from frankie.llm import TokenUsage
from frankie.memory import (
    begin_chat_turn,
    delete_session,
    finish_chat_turn,
    list_personal_memory,
    list_public_memory,
    list_sessions,
    load_session,
    rename_session,
    save_personal_memory,
    save_public_memory,
)

# ---------------------------------------------------------------------------
# FastAPI 实例
# ---------------------------------------------------------------------------

app = FastAPI(title="Frankie", version="0.1.0", docs_url="/api/docs")

# 开发模式允许 Vite dev server（localhost:5173）跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ---------------------------------------------------------------------------
# SSE 工具函数
# ---------------------------------------------------------------------------

class ChatStreamResponse(StreamingResponse):
    """Own the generator lifetime, including disconnects while sending a chunk."""

    def __init__(self, events: AsyncGenerator[str, None]):
        super().__init__(events, media_type="text/event-stream", headers={
            "Cache-Control": "no-cache", "X-Accel-Buffering": "no",
        })
        self.events = events

    async def stream_response(self, send: Send) -> None:
        try:
            await super().stream_response(send)
        finally:
            # async-for does not close a suspended generator when send fails.
            # Close here, in its owning task, so cancelled turns are persisted.
            with anyio.CancelScope(shield=True):
                await self.events.aclose()


def _sse_chunk(text: str) -> str:
    return f"data: {json.dumps({'type': 'chunk', 'text': text}, ensure_ascii=False)}\n\n"


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _sse_done(prompt_tokens: int = 0, completion_tokens: int = 0, status: str = "completed") -> str:
    return _sse_event({
        "type": "done", "status": status,
        "usage": {"prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens},
    })


CHAT_TIMEOUT_SECONDS = 240
logger = logging.getLogger(__name__)


def _response_error(exc: Exception) -> str:
    from frankie.llm import ProtocolError

    logger.warning("Model response failed: %s (request_id=%s)",
                   type(exc).__name__, getattr(exc, "request_id", None))
    if isinstance(exc, ProtocolError):
        return str(exc)
    if isinstance(exc, TimeoutError):
        return "回答超时，请重试。"
    return "模型请求失败，请稍后重试。"


async def _stream_text_response(
    system: str, messages: list[dict], action: str, vctx: VaultContext,
) -> AsyncGenerator[str, None]:
    """Non-agent endpoints use the same native response channel, without tools."""
    from frankie import llm
    from frankie.vault import append_token_log

    usage = llm.TokenUsage.zero(settings.llm.default_model)
    status = "completed"
    with use_vault_ctx(vctx):
        try:
            async with asyncio.timeout(CHAT_TIMEOUT_SECONDS):
                async with aclosing(llm.stream_response(system, messages)) as stream:
                    async for event in stream:
                        if isinstance(event, llm.TextDelta):
                            yield _sse_chunk(event.text)
                        else:
                            usage = event.usage
                            append_token_log(action, usage.model, usage.prompt_tokens, usage.completion_tokens)
                            llm.require_text_response(event)
        except Exception as exc:
            status = "failed"
            yield _sse_event({"type": "error", "message": _response_error(exc)})
        yield _sse_done(usage.prompt_tokens, usage.completion_tokens, status)


_ATTACHMENT_NAME_RE = re.compile(r"^[a-f0-9]{32}\.(?:png|jpg|jpeg|pdf|docx|pptx)$")
_ATTACHMENT_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


_TOOL_INSTRUCTION = "你可以通过工具按需检索课程 Wiki。回答只能依据工具读取到的页面和用户输入，不能臆造 Wiki 内容。先搜索再读取相关页面；证据不足时可继续搜索，但不要超过工具调用上限。凡涉及课程安排、考核、作业、考试、成绩、名单、日期、地点等事务性问题，必须先检索确认；检索不到依据时，如实回答「这块我还没有记录，请以老师/教务的最新通知为准」，严禁编造次数、日期、比例等任何细节。"


# ---------------------------------------------------------------------------
# 认证依赖与配额
# ---------------------------------------------------------------------------

async def get_current_user(request: Request) -> UserIdentity:
    """认证依赖：解析用户身份并注入其个人 Vault 上下文。"""
    try:
        user = resolve_user(request)
    except InvalidUserIdError as e:
        status = 401 if "未登录" in str(e) or "失效" in str(e) else 400
        raise HTTPException(status_code=status, detail=str(e)) from e
    ctx = user_vault_ctx(user.user_id)
    ensure_user_dirs(ctx)
    set_vault_ctx(ctx)
    return user


async def require_admin(user: UserIdentity = Depends(get_current_user)) -> UserIdentity:
    """要求管理员角色（共享课程库写操作、系统配置）。"""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def _check_quota(user: UserIdentity) -> None:
    """学生每日 token 配额检查（admin 不限）。"""
    if user.is_admin:
        return
    from frankie.vault import tokens_used_today

    used = tokens_used_today()
    limit = settings.auth_daily_token_limit
    if used >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"今日额度已用完（{used:,} / {limit:,} tokens），明天再来吧",
        )


async def _compress_history(history: list[dict], compact_at: int) -> tuple[list[dict], TokenUsage | None]:
    """Compact only at user-turn boundaries, never inside a tool transaction."""
    from frankie import llm

    def size(items: list[dict]) -> int:
        budget_items = []
        image_chars = 0
        for item in items:
            content = item.get("content")
            if isinstance(content, list):
                budget_content = []
                for block in content:
                    if block.get("type") == "image_url":
                        # DeepSeek caps images at 1,024 tokens. Reserve roughly
                        # four text characters per token, not the base64 bytes.
                        # https://api-docs.deepseek.com/guides/vision
                        image_chars += 4 * 1024
                        budget_content.append({"type": "image_url"})
                    else:
                        budget_content.append(block)
                # Only the budget copy changes; model input retains each image.
                item = {**item, "content": budget_content}
            budget_items.append(item)
        return len(json.dumps(budget_items, ensure_ascii=False)) + image_chars

    if size(history) <= compact_at:
        return history, None
    # Reserve room for the summary. Even one oversized recent turn can be
    # summarized whole; never keep an unmatched tool result or a partial batch.
    split_at = len(history)
    starts = [i for i, item in enumerate(history) if item["role"] == "user"]
    for start in reversed(starts[1:]):
        if size(history[start:]) > compact_at // 2:
            break
        split_at = start
    old_history, recent_history = history[:split_at], history[split_at:]
    lines = []
    for item in old_history:
        content = item.get("content", "")
        if isinstance(content, list):
            content = "\n".join(block.get("text", "[图片]") for block in content)
        lines.append(f"{item['role']}: {content}")
    summary, usage = await llm.chat(
        "你是对话摘要器，只输出摘要，不要补充原对话中没有的信息。",
        [{"role": "user", "content": "请保留用户目标、已确认结论、关键公式和待解决问题：\n\n" + "\n".join(lines)}],
        max_tokens=1800, temperature=0,
    )
    return [
        {"role": "user", "content": "【此前对话摘要】"},
        {"role": "assistant", "content": summary},
        *recent_history,
    ], usage


# ---------------------------------------------------------------------------
# 请求体模型
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str
    archive: bool = False


class IngestRequest(BaseModel):
    path: str
    recursive: bool = False
    force: bool = False


class SaveRequest(BaseModel):
    history: list[dict]
    topic: str | None = None


class SettingsPayload(BaseModel):
    deepseek_api_key: str | None = None
    vault_path: str | None = None
    vault_wiki_dir: str | None = None
    vault_raw_sources_dir: str | None = None
    llm_default_model: str | None = None
    llm_reasoning_model: str | None = None


class MemorySaveRequest(BaseModel):
    title: str
    content: str
    tags: list[str] = []
    source: str | None = None


class SessionRenameRequest(BaseModel):
    topic: str


class LoginRequest(BaseModel):
    user_id: str
    password: str


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


class ContentWriteRequest(BaseModel):
    path: str
    content: str


# ---------------------------------------------------------------------------
# 路由：状态
# ---------------------------------------------------------------------------

@app.post("/api/auth/login")
async def api_auth_login(req: LoginRequest, response: Response) -> dict:
    """登录并设置签名 cookie 会话。"""
    user = authenticate_user(req.user_id, req.password)
    if user is None:
        raise HTTPException(status_code=401, detail="账号或密码错误")
    token = make_session_token(user.user_id)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    record = _get_user_record(user.user_id)
    return {
        "user_id": user.user_id,
        "display_name": user.display_name,
        "role": user.role,
        "must_change_password": bool(record and record.get("must_change_password", False)),
    }


@app.post("/api/auth/logout")
async def api_auth_logout(response: Response, user: UserIdentity = Depends(get_current_user)) -> dict:
    """退出登录并清除 cookie。"""
    _ = user
    response.delete_cookie(key=SESSION_COOKIE_NAME, httponly=True, samesite="lax")
    return {"ok": True}


@app.post("/api/auth/change-password")
async def api_auth_change_password(req: PasswordChangeRequest, user: UserIdentity = Depends(get_current_user)) -> dict:
    """修改当前用户密码。"""
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="新密码长度至少 8 位")
    current = authenticate_user(user.user_id, req.old_password)
    if current is None:
        raise HTTPException(status_code=401, detail="原密码错误")
    set_user_password(user.user_id, req.new_password)
    return {"ok": True, "message": "密码修改成功"}


@app.get("/api/auth/me")
async def api_auth_me(user: UserIdentity = Depends(get_current_user)) -> dict:
    """返回当前用户身份（前端据此区分 admin/student 界面）。"""
    record = _get_user_record(user.user_id)
    return {
        "user_id": user.user_id,
        "display_name": user.display_name,
        "role": user.role,
        "must_change_password": bool(record and record.get("must_change_password", False)),
    }


@app.get("/api/balance")
async def api_balance(user: UserIdentity = Depends(require_admin)) -> dict:
    """单独的余额查询端点（共享 API Key 余额，仅管理员可见）。"""
    from frankie import llm
    return llm.fetch_balance()


@app.get("/api/status")
async def api_status(user: UserIdentity = Depends(get_current_user)) -> dict:
    from frankie.agent import wiki_context_budget
    """返回当前用户的结构化状态数据（个人库 + 当日配额）。"""
    from frankie.vault import list_wiki_notes, summarize_token_log, tokens_used_today

    v = get_vault_ctx()
    wiki_path = v.wiki_path
    wiki_notes = list_wiki_notes()
    sources_count = len(list(wiki_path.glob(f"{v.wiki_sources_dir}/*.md"))) if wiki_path.exists() else 0
    queries_count = len(list(wiki_path.glob(f"{v.wiki_queries_dir}/*.md"))) if wiki_path.exists() else 0

    return {
        "user": {"user_id": user.user_id, "role": user.role},
        "vault": {
            "path": str(v.path),
            "exists": v.path.exists(),
            "raw_sources_dir": str(v.raw_sources_path) if v.raw_sources_path else None,
        },
        "wiki": {
            "path": str(wiki_path),
            "exists": wiki_path.exists(),
            "total_notes": len(wiki_notes),
            "sources_count": sources_count,
            "queries_count": queries_count,
        },
        "llm": {
            "api_key_set": bool(settings.llm.api_key),
            "base_url": settings.llm.base_url,
            "default_model": settings.llm.default_model,
            "reasoning_model": settings.llm.reasoning_model,
        },
        "token_usage": summarize_token_log(),
        "quota": {
            "used_today": tokens_used_today(),
            "daily_limit": settings.auth_daily_token_limit,
            "limited": not user.is_admin,
        },
        "context": wiki_context_budget([shared_vault_ctx(), get_vault_ctx()]),
    }


# ---------------------------------------------------------------------------
# 路由：文件树
# ---------------------------------------------------------------------------

def _markdown_heading(p: Path) -> str:
    """提取 Markdown 文件首个 H1 标题，失败时回退到文件名（不含扩展名）。"""
    try:
        for line in p.read_text(encoding="utf-8").splitlines()[:30]:
            if line.startswith("# "):
                return line[2:].strip()
    except OSError:
        pass
    return p.stem


def _sources_payload(layer: str) -> dict:
    """返回当前上下文中原始资料目录树及每个文件的摄取状态。"""
    from frankie.vault import collect_files, load_ingest_log
    from datetime import datetime

    raw_path = get_vault_ctx().raw_sources_path
    if not raw_path or not raw_path.exists():
        return {"layer": layer, "files": []}

    # raw_sources 位于 wiki 目录内部（frankie-wiki/raw），需关闭 wiki 目录跳过
    paths = collect_files(raw_path, recursive=True, skip_wiki=False)
    log_files: dict = load_ingest_log().get("files", {})

    result = []
    for p in paths:
        rel = str(p.relative_to(raw_path))
        key = str(p.resolve())
        record = log_files.get(key)

        if p.stat().st_size == 0:
            status = "empty"
            last_ingested = None
        elif record is None:
            status = "new"
            last_ingested = None
        else:
            ingested_at = record.get("ingested_at", [])
            last_ingested = ingested_at[-1] if ingested_at else None
            if last_ingested:
                try:
                    mtime = datetime.fromtimestamp(p.stat().st_mtime)
                    if mtime > datetime.fromisoformat(last_ingested):
                        status = "changed"
                    else:
                        status = "done"
                except (ValueError, OSError):
                    status = "done"
            else:
                status = "new"

        result.append({
            "path": rel,
            "abs_path": str(p),
            "title": _markdown_heading(p),
            "status": status,
            "last_ingested": last_ingested,
        })

    return {"layer": layer, "root": str(raw_path), "files": result}


@app.get("/api/sources")
async def api_sources(
    user: UserIdentity = Depends(get_current_user),
    layer: str = "personal",
) -> dict:
    """返回原始资料目录树及摄取状态。

    layer=personal：当前用户的个人资料（可上传、可摄取）
    layer=course：  共享课程资料（全员只读）
    """
    if layer == "course":
        with use_vault_ctx(shared_vault_ctx()):
            return _sources_payload(layer)
    return _sources_payload(layer)


def _wiki_files_for(ctx, layer: str) -> list[dict]:
    """读取指定 VaultContext 的 Wiki 目录树（含 frontmatter 元数据）。"""
    import frontmatter as fm

    wiki_path = ctx.wiki_path
    if not wiki_path.exists():
        return []

    result = []
    for p in sorted(wiki_path.rglob("*.md")):
        rel = str(p.relative_to(wiki_path))
        if any(part.lower() in hidden_content_dirs() for part in p.relative_to(wiki_path).parts):
            continue
        try:
            post = fm.load(str(p))
            raw_type  = post.get("type")
            raw_title = post.get("title")
            raw_date  = post.get("date")
            raw_tags  = post.get("tags")
            note_type = str(raw_type)  if raw_type  is not None else ""
            title     = str(raw_title).strip() if raw_title is not None and str(raw_title).strip() else ""
            if not title:
                # 笔记无 frontmatter title 时，回退到正文首个 H1 标题，而非文件名
                for line in post.content.splitlines():
                    if line.startswith("# "):
                        title = line[2:].strip()
                        break
            if not title:
                title = p.stem
            date      = str(raw_date)  if raw_date  is not None else ""
            tags      = list(raw_tags) if isinstance(raw_tags, (list, tuple)) else []
        except Exception:
            note_type, title, date, tags = "", p.stem, "", []
        if not note_type:
            note_type = next(
                (part for part in ("source", "query", "insight", "entity", "concept") if part in p.parts),
                "other",
            )
        result.append({
            "rel_path": rel,
            "abs_path": str(p),
            "layer": layer,
            "type": note_type,
            "title": title,
            "date": date,
            "tags": tags,
            "search_text": f"{title} {rel} {' '.join(tags)} {p.read_text(encoding='utf-8').lower()}",
        })
    return result


@app.get("/api/wiki")
async def api_wiki(user: UserIdentity = Depends(get_current_user)) -> dict:
    """返回课程 Wiki 目录树；raw 课件由 /api/sources 单独返回。"""
    return {"files": _wiki_files_for(shared_vault_ctx(), "course")}


@app.get("/api/memory/public")
async def api_memory_public(user: UserIdentity = Depends(get_current_user)) -> dict:
    """返回共享 public memory 列表，所有用户可读。"""
    with use_vault_ctx(shared_vault_ctx()):
        entries = list_public_memory()
    return {"memory": [e.__dict__ for e in entries]}


@app.get("/api/memory/personal")
async def api_memory_personal(user: UserIdentity = Depends(get_current_user)) -> dict:
    """返回当前用户的个人 memory 列表。"""
    entries = list_personal_memory()
    return {"memory": [e.__dict__ for e in entries]}


@app.post("/api/memory/public")
async def api_save_public_memory(
    payload: MemorySaveRequest,
    user: UserIdentity = Depends(require_admin),
) -> dict:
    """管理员添加共享 public memory 条目。"""
    with use_vault_ctx(shared_vault_ctx()):
        entry_id = save_public_memory(
            title=payload.title,
            content=payload.content,
            tags=payload.tags,
            source=payload.source,
            created_by=user.user_id,
        )
    return {"ok": True, "id": entry_id}


@app.post("/api/memory/personal")
async def api_save_personal_memory(
    payload: MemorySaveRequest,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """保存当前用户的个人 memory 条目。"""
    entry_id = save_personal_memory(
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        source=payload.source,
        user_id=user.user_id,
    )
    return {"ok": True, "id": entry_id}


@app.get("/api/history")
async def api_list_history(user: UserIdentity = Depends(get_current_user)) -> dict:
    """返回当前用户最近会话列表。"""
    sessions = list_sessions(user_id=user.user_id)
    return {"sessions": sessions}


@app.get("/api/history/{session_id}")
async def api_get_history(
    session_id: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """读取指定会话历史。"""
    session = load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") and session["user_id"] != user.user_id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"session": session}


@app.patch("/api/history/{session_id}")
async def api_rename_history(
    session_id: str,
    payload: SessionRenameRequest,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    if not rename_session(session_id, payload.topic, user_id=user.user_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@app.delete("/api/history/{session_id}")
async def api_delete_history(
    session_id: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    if not delete_session(session_id, user_id=user.user_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@app.get("/api/wiki/resolve")
async def api_wiki_resolve(
    title: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """根据 Wiki 页面标题（stem，不含路径和 .md）找到实际文件。

    查找顺序：个人库优先，其次课程共享库；同名冲突时个人胜出。
    """
    raw_target = unquote(title.strip()).replace("\\", "/")
    parsed_target = urlparse(raw_target)
    target = (parsed_target.path if parsed_target.scheme or parsed_target.netloc else raw_target).lower()
    target = target.lstrip("/")
    while target.startswith("../"):
        target = target[3:]
    target = target.removeprefix("./")
    target = target.split("#", 1)[0].split("|", 1)[0].strip()

    def normalized(value: str) -> str:
        return re.sub(r"[\s_\-]+", "", value.lower())

    normalized_target = normalized(target.removesuffix(".md"))

    def _page_heading(path: Path) -> str:
        """读取页面第一个 H1 标题。"""
        try:
            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines()[:20]:
                if line.startswith("# "):
                    return line[2:].strip()
        except Exception:
            pass
        return ""

    def _ascii_only(value: str) -> str:
        return re.sub(r"[^A-Za-z0-9]", "", value.lower())

    def _heading_acronym(value: str) -> str:
        return "".join(word[0] for word in re.findall(r"[A-Za-z]+", value)).lower()

    t_ascii = _ascii_only(target)
    for ctx, layer in ((get_vault_ctx(), "personal"), (shared_vault_ctx(), "course")):
        wiki_path = ctx.wiki_path
        if not wiki_path.exists():
            continue

        # Source links in generated Markdown point at the original file. Resolve
        # them through the ingest log so the rendered Wiki note is opened instead.
        ingest_files = __import__("frankie.vault", fromlist=["load_ingest_log"]).load_ingest_log().get("files", {})
        for source_path, record in ingest_files.items():
            wiki_page = str(record.get("wiki_page") or "")
            if not wiki_page:
                continue
            source_path_norm = source_path.replace("\\", "/").lower()
            source_file = Path(source_path_norm).name
            source_stem = Path(source_file).stem
            source_candidates = {
                source_path_norm,
                source_path_norm.removesuffix(".md"),
                source_file,
                source_stem,
                wiki_page.lower(),
                wiki_page.lower().removesuffix(".md"),
            }
            source_candidates.update({candidate.removeprefix("raw/").removeprefix("lectures/") for candidate in source_candidates})
            if target not in source_candidates and normalized_target not in {
                normalized(candidate.removesuffix(".md")) for candidate in source_candidates
            }:
                continue
            note = wiki_path / wiki_page
            if note.is_file():
                return {
                    "title": title,
                    "abs_path": str(note),
                    "rel_path": str(note.relative_to(wiki_path)),
                    "layer": layer,
                }
        for note in sorted(wiki_path.rglob("*.md")):
            if any(part.lower() in hidden_content_dirs() for part in note.relative_to(wiki_path).parts):
                continue
            rel_path = str(note.relative_to(wiki_path)).replace("\\", "/")
            candidates = {note.stem.lower(), rel_path.lower(), rel_path.removesuffix(".md").lower()}
            candidates.update({candidate.removeprefix("raw/") for candidate in candidates})
            try:
                import frontmatter as fm
                page_title = str(fm.load(str(note)).get("title", "")).strip().lower()
                if page_title:
                    candidates.add(page_title)
            except Exception:
                pass
            if target in candidates or normalized_target in {
                normalized(candidate.removesuffix(".md")) for candidate in candidates
            }:
                return {
                    "title": title,
                    "abs_path": str(note),
                    "rel_path": str(note.relative_to(wiki_path)),
                    "layer": layer,
                }
        # 回退匹配：中文标题/缩写（如 HJB方程、Bellman方程）也能打开对应页面
        for note in sorted(wiki_path.rglob("*.md")):
            if any(part.lower() in hidden_content_dirs() for part in note.relative_to(wiki_path).parts):
                continue
            heading = _page_heading(note)
            if not heading:
                continue
            h_norm = normalized(heading)
            h_ascii = _ascii_only(heading)
            acro = _heading_acronym(heading)
            if (
                (len(normalized_target) >= 4 and (normalized_target in h_norm or h_norm in normalized_target))
                or (len(t_ascii) >= 3 and (t_ascii in h_ascii or h_ascii in t_ascii))
                or (len(t_ascii) >= 2 and (t_ascii == acro or acro.startswith(t_ascii) or t_ascii.startswith(acro)))
            ):
                return {
                    "title": title,
                    "abs_path": str(note),
                    "rel_path": str(note.relative_to(wiki_path)).replace(chr(92), "/"),
                    "layer": layer,
                }
    raise HTTPException(status_code=404, detail=f"Wiki page not found: {title}")


@app.get("/api/file")
async def api_file(
    path: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """读取单个文件内容（sources 或 wiki）。

    安全检查：只允许读取"当前用户个人库 + 共享课程库"白名单内的文件，
    防止通过 ../../ 越权读取其他用户数据。
    """
    p = Path(path)
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    allowed_roots = [get_vault_ctx().path.resolve(), shared_vault_ctx().path.resolve()]
    resolved = p.resolve()
    if not any(resolved.is_relative_to(root) for root in allowed_roots):
        raise HTTPException(status_code=403, detail="Path outside allowed vaults")
    if is_hidden_admin_path(resolved) and not user.is_admin:
        raise HTTPException(status_code=403, detail="无权访问该文件")
    return {"path": path, "content": p.read_text(encoding="utf-8")}


# ---------------------------------------------------------------------------
# 路由：LLM 流式（SSE）
# ---------------------------------------------------------------------------

@app.post("/api/chat")
async def api_chat(
    message: str = Form(...),
    session_id: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
    user: UserIdentity = Depends(get_current_user),
) -> StreamingResponse:
    """Chat 模式多轮对话，SSE 流式返回。"""
    from frankie import llm
    from frankie.agent import _BASE_SYSTEM
    from frankie.agent_runtime import run_agent
    from frankie.vault import append_token_log
    from frankie.attachments import prepare_attachment

    _check_quota(user)
    if not message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")
    try:
        attachment_blocks: list[dict] = []
        attachment_text: list[str] = []
        saved_attachments: list[dict] = []
        attachments_dir = get_vault_ctx().root / "attachments"
        attachments_dir.mkdir(parents=True, exist_ok=True)
        for upload in files:
            filename = upload.filename or "未命名附件"
            data = await upload.read()
            name, prepared = prepare_attachment(filename, data)
            # 持久化原始字节到用户附件目录，生成可追溯的引用（{uuid}{后缀}）
            stored_name = f"{uuid.uuid4().hex}{Path(filename).suffix.lower()}"
            (attachments_dir / stored_name).write_bytes(data)
            saved_attachments.append({"id": stored_name, "name": filename})
            if isinstance(prepared, dict):
                attachment_blocks.append(prepared)
                attachment_text.append(f"【已附加图片：{name}】")
            else:
                attachment_text.append(prepared)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"附件处理失败：{exc}") from exc

    req_message = message
    if attachment_text:
        req_message = f"{message}\n\n" + "\n\n".join(attachment_text)
    vctx = get_vault_ctx()
    # 个人 memory 走当前用户 context，公共 memory 走共享课程库 context。
    with use_vault_ctx(shared_vault_ctx()):
        public_memory = list_public_memory(limit=3)
    with use_vault_ctx(vctx):
        personal_memory = list_personal_memory(limit=3)

    memory_context = []
    if public_memory:
        memory_context.append("【公共记忆】")
        memory_context.extend(f"- {e.title}: {e.content}" for e in public_memory)
    if personal_memory:
        memory_context.append("【个人记忆】")
        memory_context.extend(f"- {e.title}: {e.content}" for e in personal_memory)
    memory_context = "\n".join(memory_context)

    _CHAT_MODE_ADDON = r"""
当前模式：自由对话。

你的角色定位（严格遵守）：
- 你就是这份知识库本身，以管理者的口吻直接表达知识，不要说"根据 Wiki"、"资料显示"、"Wiki 中提到"等疏离表达
- 把知识当成自己的认知直接输出，就像一个博学的朋友在和你聊天，而不是在引用文献
- 用词自信、简洁，避免"可能"、"似乎"等不必要的不确定性修饰——除非确实存在争议

知识边界（严格遵守）：
- 如果知识库中没有相关内容，直接说「这块我还没有记录，建议你另行查阅」
- 禁止用训练知识填补知识库的空白，用户需要的是他自己归纳的知识，不是通用 AI 的推测
- 涉及课程安排、考核、作业、考试、成绩、名单、日期、地点等事务性问题：必须先检索 Wiki；检索不到依据时，回答「这块我还没有记录，请以老师/教务的最新通知为准」，严禁编造作业次数、考试日期、成绩占比等任何细节
- 一切数字、日期、名称、政策都必须能在本次检索到的页面或用户资料中找到依据；找不到就是没有，一律明说，绝不使用训练知识补全

引用格式（严格遵守）：
- 在正文中需要标注来源时，直接行内嵌入 [[页面名]]，前端会自动渲染为上标角标
- 禁止在正文外单独列出"引用来源"清单，禁止写 (1)、（1）、[1]、"见参考资料 1"等手动编号
- [[页面名]] 紧跟在引用的具体结论之后，不要独占一行、不要出现在句首

公式输出规范（严格遵守）：
- 行内公式（短公式）用 $...$ 包裹，前后必须有空格或标点隔开
- 块级公式（复杂公式/分式/积分/求和/矩阵）必须独占一行，前后留空行
- 格式示例（注意换行）：
  $$
  \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
  $$
- 禁止在列表项行尾直接接 $$...$$，必须把公式换到下一行
- 常见写法：$F = ma$；$N(\mu, \sigma^2)$；$\frac{\partial f}{\partial x}$；$\sum_{i=1}^n x_i$
- 所有数学、物理、化学、统计等公式必须用 LaTeX 语法输出
"""
    injected = answer_context()
    chat_system_prompt = (
        _TOOL_INSTRUCTION + "\n\n"
        f"公共与个人记忆：\n{memory_context}\n\n"
        + (_BASE_SYSTEM + _CHAT_MODE_ADDON).replace("{wiki_path}", str(vctx.wiki_path))
        + (f"\n\n{injected}" if injected else "")
    )

    from frankie.agent import wiki_context_budget
    compact_at = wiki_context_budget([shared_vault_ctx(), vctx])["history_compact_at"]
    user_content: str | list[dict] = req_message
    if attachment_blocks:
        user_content = [{"type": "text", "text": req_message}, *attachment_blocks]
    try:
        turn = begin_chat_turn(
            session_id, user_id=user.user_id, user_text=message,
            attachments=saved_attachments,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    async def generate() -> AsyncGenerator[str, None]:
        parts: list[str] = []
        transcript: list[dict] = []
        status = "cancelled"
        error: str | None = None
        prompt_tokens = completion_tokens = 0
        with use_vault_ctx(vctx):
            try:
                yield _sse_event({"type": "session", "session_id": turn["session_id"], "topic": turn["topic"]})
                if saved_attachments:
                    yield _sse_event({"type": "attachments", "attachments": saved_attachments})
                async with asyncio.timeout(CHAT_TIMEOUT_SECONDS):
                    history, compression_usage = await _compress_history(turn["history"], compact_at)
                    if compression_usage is not None:
                        prompt_tokens += compression_usage.prompt_tokens
                        completion_tokens += compression_usage.completion_tokens
                        append_token_log("compact", compression_usage.model, compression_usage.prompt_tokens, compression_usage.completion_tokens)
                    system, messages = llm.build_messages(chat_system_prompt, history, user_content)
                    async with aclosing(run_agent(shared_vault_ctx(), system, messages)) as events:
                        async for event in events:
                            if event["type"] == "usage":
                                usage = event["usage"]
                                prompt_tokens += usage.prompt_tokens
                                completion_tokens += usage.completion_tokens
                                append_token_log("chat", usage.model, usage.prompt_tokens, usage.completion_tokens)
                            elif event["type"] == "complete":
                                transcript = [messages[-1], *event["messages"]]
                            else:
                                if event["type"] == "chunk":
                                    parts.append(event["text"])
                                yield _sse_event(event)
                    if not transcript:
                        raise llm.ProtocolError("对话未正常完成")
                status, error = "completed", None
            except Exception as exc:
                status, error = "failed", _response_error(exc)
            finally:
                # Also runs on cancellation. Retain the submitted input even
                # when no complete agent transcript is available yet.
                finish_chat_turn(
                    turn["turn_id"],
                    messages=transcript or [{"role": "user", "content": user_content}],
                    assistant_text="".join(parts), status=status, error=error,
                )
            if error:
                yield _sse_event({"type": "error", "message": error})
            yield _sse_done(prompt_tokens, completion_tokens, status)

    return ChatStreamResponse(generate())


@app.get("/api/attachments/{name}")
async def api_get_attachment(name: str, user: UserIdentity = Depends(get_current_user)) -> FileResponse:
    """返回当前用户已上传的附件文件（按用户目录隔离，路径经严格校验）。"""
    if not _ATTACHMENT_NAME_RE.fullmatch(name):
        raise HTTPException(status_code=404, detail="附件不存在")
    path = get_vault_ctx().root / "attachments" / name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="附件不存在")
    media_type = _ATTACHMENT_MIME.get(Path(name).suffix.lower(), "application/octet-stream")
    return FileResponse(path, media_type=media_type)


@app.post("/api/query")
async def api_query(req: QueryRequest, user: UserIdentity = Depends(get_current_user)) -> StreamingResponse:
    """Query/Wiki 模式，SSE 流式返回。"""
    from frankie import llm
    from frankie.agent import _BASE_SYSTEM, load_layered_wiki_context

    _check_quota(user)
    vctx = get_vault_ctx()
    wiki_context = load_layered_wiki_context(shared_vault_ctx(), query=req.question)

    with use_vault_ctx(shared_vault_ctx()):
        public_memory = list_public_memory(limit=3)
    with use_vault_ctx(vctx):
        personal_memory = list_personal_memory(limit=3)

    memory_context = []
    if public_memory:
        memory_context.append("【公共记忆】")
        memory_context.extend(f"- {e.title}: {e.content}" for e in public_memory)
    if personal_memory:
        memory_context.append("【个人记忆】")
        memory_context.extend(f"- {e.title}: {e.content}" for e in personal_memory)
    memory_context = "\n".join(memory_context)

    index_text = _load_wiki_index()
    user_prompt = f"问题：{req.question}\n\n---目录索引---\n{index_text}\n\n---知识库内容---\n{wiki_context}\n\n个人与共享记忆：\n{memory_context}"

    _WEB_QUERY_ADDON = r"""
当前模式：知识库问答。

你的角色定位（严格遵守）：
- 你就是这份知识库本身，直接以第一人称回答，不要说"根据 Wiki"、"资料显示"等疏离表达
- 把知识当成自己的认知输出，语气自信、简洁，像一个博学的朋友在交流
- 如果知识库中没有相关内容，直接说「这块我还没有记录，建议另行查阅」

引用格式（严格遵守）：
- 在正文中需要标注来源时，直接行内嵌入 [[页面名]]，前端会自动渲染为上标角标
- 禁止在正文外单独列出"引用来源"清单，禁止写 (1)、（1）、[1]、"见参考资料 1"等手动编号
- [[页面名]] 紧跟在引用的具体结论之后，不要独占一行、不要出现在句首

知识边界（严格遵守）：
- 只使用知识库内容回答，禁止用训练知识填补知识库的空白
- 不要推测或补全知识库中不存在的信息
- 涉及课程安排、考核、作业、考试、成绩、名单等事务性问题：知识库中检索不到依据时，回答「这块我还没有记录，请以老师/教务的最新通知为准」，严禁编造
- 任何数字、日期、名称、政策都必须能在上文知识库内容中找到依据，找不到就是没有，一律明说

公式输出规范（严格遵守）：
- 行内公式（短公式）用 $...$ 包裹，前后必须有空格或标点隔开
- 块级公式（复杂公式/分式/积分/求和/矩阵）必须独占一行，前后留空行
- 格式示例（注意换行）：
  $$
  \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
  $$
- 禁止在列表项行尾直接接 $$...$$，必须把公式换到下一行
- 常见写法：$F = ma$；$N(\mu, \sigma^2)$；$\frac{\partial f}{\partial x}$；$\sum_{i=1}^n x_i$
- 所有数学、物理、化学、统计等公式必须用 LaTeX 语法输出
"""

    injected = answer_context()
    query_system = (_BASE_SYSTEM + _WEB_QUERY_ADDON).replace("{wiki_path}", str(vctx.wiki_path))
    if injected:
        query_system += "\n\n" + injected
    system, messages = llm.build_messages(query_system, [], user_prompt)

    return ChatStreamResponse(_stream_text_response(system, messages, "query", vctx))


@app.post("/api/lint")
async def api_lint(user: UserIdentity = Depends(get_current_user)) -> StreamingResponse:
    """Wiki 健康检查（个人库），SSE 流式返回。"""
    from frankie import llm
    from frankie.agent import _LINT_SYSTEM, _load_wiki_context

    _check_quota(user)
    vctx = get_vault_ctx()
    wiki_context = _load_wiki_context(max_files=50)
    user_prompt = f"请对以下 Wiki 进行全面健康检查：\n\n---Wiki 内容---\n{wiki_context}"
    system, messages = llm.build_messages(
        _LINT_SYSTEM.replace("{wiki_path}", str(vctx.wiki_path)), [], user_prompt
    )

    return ChatStreamResponse(_stream_text_response(system, messages, "lint", vctx))


# ---------------------------------------------------------------------------
# 路由：Ingest / Save
# ---------------------------------------------------------------------------

async def _run_ingest(req: IngestRequest, allowed_root: Path) -> dict:
    """在当前上下文中执行文件/目录摄取；路径必须位于 allowed_root 内。"""
    from frankie.agent import ingest as agent_ingest
    from frankie.vault import collect_files, find_index_context

    path = Path(req.path).resolve()
    if not path.is_relative_to(allowed_root.resolve()):
        raise HTTPException(status_code=403, detail="只能摄取本知识库目录内的文件")
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {req.path}")

    files = collect_files(path, recursive=req.recursive) if path.is_dir() else [path]
    results = []
    for f in files:
        content = f.read_text(encoding="utf-8")
        index_context = find_index_context(f)
        wiki_page = await agent_ingest(
            content, f.stem,
            source_path=f,
            index_context=index_context,
            stream=False,
        )
        results.append({"file": str(f), "wiki_page": wiki_page})

    return {"ingested": len(results), "results": results}


@app.post("/api/ingest")
async def api_ingest(req: IngestRequest, user: UserIdentity = Depends(get_current_user)) -> dict:
    """摄取当前用户个人库中的文件（非流式，后台执行）。"""
    _check_quota(user)
    raw = get_vault_ctx().raw_sources_path
    if raw is None:
        raise HTTPException(status_code=400, detail="个人资料目录未配置")
    return await _run_ingest(req, raw)


@app.post("/api/admin/ingest-shared")
async def api_admin_ingest_shared(req: IngestRequest, user: UserIdentity = Depends(require_admin)) -> dict:
    """管理员摄取共享课程库中的文件（全班立即可用）。"""
    sctx = shared_vault_ctx()
    ensure_user_dirs(sctx)
    raw = sctx.raw_sources_path
    if raw is None:
        raise HTTPException(status_code=400, detail="共享课程资料目录未配置")
    with use_vault_ctx(sctx):
        return await _run_ingest(req, raw)


@app.post("/api/save")
async def api_save(req: SaveRequest, user: UserIdentity = Depends(get_current_user)) -> dict:
    """将对话历史归档为洞见页（管理员专用，写入管理员个人库）。"""
    from frankie.agent import save_insight

    if not user.is_admin:
        raise HTTPException(status_code=403, detail="归档洞见仅管理员可用")
    _check_quota(user)
    filename = await save_insight(req.history, topic=req.topic, stream=False)
    return {"wiki_page": filename}


# ---------------------------------------------------------------------------
# 路由：文件上传
# ---------------------------------------------------------------------------

_UPLOAD_MAX_BYTES = 20 * 1024 * 1024  # 单个上传文件上限 20MB


@app.post("/api/upload")
async def api_upload(
    request: Request,
    filename: str,
    layer: str = "personal",
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """上传原始资料文件（请求体为文件字节流）。

    layer=personal：上传到当前用户个人资料目录（默认）
    layer=course：  上传到共享课程资料目录（仅 admin）
    """
    if layer == "course":
        if not user.is_admin:
            raise HTTPException(status_code=403, detail="课程资料仅管理员可上传")
        ctx = shared_vault_ctx()
        ensure_user_dirs(ctx)
    else:
        ctx = get_vault_ctx()

    raw = ctx.raw_sources_path
    if raw is None:
        raise HTTPException(status_code=400, detail="资料目录未配置")

    safe_name = Path(filename).name
    if not safe_name or safe_name.startswith("."):
        raise HTTPException(status_code=400, detail="非法文件名")

    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="空文件")
    if len(data) > _UPLOAD_MAX_BYTES:
        raise HTTPException(status_code=413, detail="文件超过 20MB 上限")

    raw.mkdir(parents=True, exist_ok=True)
    target = raw / safe_name
    target.write_bytes(data)
    return {"ok": True, "path": safe_name, "size": len(data), "layer": layer}


# ---------------------------------------------------------------------------
# 路由：配置
# ---------------------------------------------------------------------------

def _mask_key(value: str) -> str:
    """将 API Key 中段替换为 *，只保留首 4 位和末 4 位。
    例：sk-a1b2c3d4e5f6g7h8 → sk-a****g7h8
    """
    if not value:
        return ""
    if len(value) <= 12:
        return "***已配置***"
    return value[:6] + "*" * (len(value) - 10) + value[-4:]


def _read_env_pairs() -> list[dict]:
    """读取 .env 文件，返回 [{key, raw, masked}] 列表。
    key 中带 KEY/TOKEN/SECRET/PASSWORD 的值自动脱敏。
    """
    env_path = Path(__file__).parent.parent.parent / ".env"
    if not env_path.exists():
        return []
    pairs = []
    sensitive_keywords = ("KEY", "TOKEN", "SECRET", "PASSWORD", "PASS")
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        is_sensitive = any(kw in k.upper() for kw in sensitive_keywords)
        pairs.append({
            "key": k,
            "value": _mask_key(v) if is_sensitive else v,
            "sensitive": is_sensitive,
        })
    return pairs


def _read_toml_raw() -> dict:
    """读取 config/settings.toml，返回原始字典，不存在时返回空 {}。"""
    toml_path = Path(__file__).parent.parent.parent / "config" / "settings.toml"
    if not toml_path.exists():
        return {}
    try:
        import tomllib
        return tomllib.loads(toml_path.read_text(encoding="utf-8"))
    except Exception:
        return {}


@app.get("/api/settings")
async def api_get_settings(user: UserIdentity = Depends(require_admin)) -> dict:
    """读取当前配置（API Key 脱敏），返回结构化 toml 和 .env 条目。仅管理员。"""
    return {
        "toml": _read_toml_raw(),
        "env": _read_env_pairs(),
        # 快捷摘要（兼容旧字段，供状态卡片用）
        "summary": {
            "vault_path": str(settings.vault.path),
            "wiki_dir": settings.vault.wiki_dir,
            "raw_sources_dir": settings.vault.raw_sources_dir,
            "default_model": settings.llm.default_model,
            "reasoning_model": settings.llm.reasoning_model,
            "api_key_masked": _mask_key(settings.llm.api_key),
            "base_url": settings.llm.base_url,
        },
    }


@app.post("/api/settings")
async def api_save_settings(payload: SettingsPayload, user: UserIdentity = Depends(require_admin)) -> dict:
    """更新配置文件（settings.toml 和 .env）。仅管理员。"""
    # TODO: Phase 3 实现 — 解析并写回 toml + .env，然后热重载 settings 单例
    return {"ok": True, "message": "配置保存功能待 Phase 3 实现"}


# ---------------------------------------------------------------------------
# 路由：内容管理（admin-only：FAQ / 进度 / Wiki / 讲义 编辑 + git 同步）
# ---------------------------------------------------------------------------

@app.get("/api/admin/content")
async def api_admin_content_list(user: UserIdentity = Depends(require_admin)) -> dict:
    """列出管理员可编辑文件（FAQ/进度 + Wiki + 讲义）。"""
    return {"files": list_admin_files()}


@app.get("/api/admin/content/read")
async def api_admin_content_read(path: str, user: UserIdentity = Depends(require_admin)) -> dict:
    """读取单个管理员文件内容。"""
    try:
        return read_admin_file(path)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.put("/api/admin/content")
async def api_admin_content_write(payload: ContentWriteRequest, user: UserIdentity = Depends(require_admin)) -> dict:
    """保存管理员文件（直接写盘，立即生效）。"""
    try:
        return write_admin_file(payload.path, payload.content)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# 静态文件托管（生产模式）
# ---------------------------------------------------------------------------

_FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

if _FRONTEND_DIST.exists():
    # 生产模式：托管构建产物
    app.mount("/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="static")


# ---------------------------------------------------------------------------
# CLI 入口（由 pyproject.toml 中 frankie-web 调用）
# ---------------------------------------------------------------------------

def run_web(port: int = 7860, no_open: bool = False) -> None:
    """启动 Web 服务并可选择自动打开浏览器。"""
    import uvicorn
    import webbrowser
    import threading

    url = f"http://localhost:{port}"
    if not no_open:
        # 延迟 1 秒后打开，确保服务已启动
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    print(f"frankie web UI → {url}")
    print("按 Ctrl+C 停止服务")
    uvicorn.run("frankie.web:app", host="0.0.0.0", port=port, reload=False)
