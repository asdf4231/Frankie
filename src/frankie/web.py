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
import sqlite3
import uuid
from collections.abc import AsyncGenerator
from contextlib import aclosing, asynccontextmanager
from pathlib import Path
from typing import Annotated
from urllib.parse import unquote, urlparse

import anyio
import frontmatter as fm
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import APIError
from pydantic import BaseModel
from starlette.types import Send

from frankie import learning
from frankie.agent import _load_wiki_index
from frankie.auth import (
    SESSION_COOKIE_NAME,
    InvalidUserIdError,
    UserIdentity,
    _get_user_record,
    authenticate_user,
    ensure_user_dirs,
    list_users,
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
from frankie.content import answer_context
from frankie.llm import ProtocolError, TokenUsage
from frankie.memory import (
    begin_chat_turn,
    delete_session,
    finish_chat_turn,
    initialize_history,
    list_sessions,
    load_session,
    rename_session,
)

# ---------------------------------------------------------------------------
# FastAPI 实例
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local and deployed Uvicorn both complete this before serving requests.
    # Readers can rely on the same schema that normal chat access initializes.
    for user in list_users():
        with use_vault_ctx(user_vault_ctx(user.user_id)):
            try:
                initialize_history()
            except Exception as exc:
                raise RuntimeError(f"History initialization failed for account {user.user_id!r}") from exc
    yield


app = FastAPI(title="Frankie", version="0.1.0", docs_url="/api/docs", lifespan=lifespan)

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

    def __init__(self, events: AsyncGenerator[str]):
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


def _error_detail(exc: Exception) -> tuple[int, str]:
    """Classify a failure so clients see which layer broke and logs keep details."""
    if isinstance(exc, (APIError, ProtocolError, TimeoutError)):
        logger.warning("Model request failed: %s (request_id=%s)",
                       type(exc).__name__, getattr(exc, "request_id", None))
        if isinstance(exc, ProtocolError):
            return 502, str(exc)
        if isinstance(exc, TimeoutError):
            return 504, "回答超时，请重试。"
        return 502, "模型请求失败，请稍后重试。"
    if isinstance(exc, sqlite3.Error):
        logger.exception("History database error")
        return 500, "服务器读取对话记录失败，请联系管理员。"
    if isinstance(exc, OSError):
        logger.exception("Filesystem error")
        return 500, "服务器读写文件失败，请联系管理员。"
    logger.exception("Unhandled request failure")
    return 500, "服务器内部错误，请联系管理员。"


async def _stream_text_response(
    system: str, messages: list[dict], action: str, vctx: VaultContext,
) -> AsyncGenerator[str]:
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
            yield _sse_event({"type": "error", "message": _error_detail(exc)[1]})
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


_WEB_CHAT_SYSTEM = """你是 Frankie，像授课教师或助教一样直接、明确地回答课程问题。

- 直接讲解知识，不转述资料或描述检索过程。不说“FAQ 提醒”“FAQ 给的例子”“根据 Wiki”等，来源通过引用标记交代。不确定时仍须明确说明。
- 优先检索课程 Wiki，并阅读相关页面；必要时查阅课程讲义。完成相关检索后，若材料仍不足以回答问题，可以使用训练知识补充，由你判断是否需要。
- 若 faq.md 的 FAQ 条目直接回答了问题，以其答案为准作答，并在相应结论后引用 [[faq|课程 FAQ]]。
- 回答中的符号、定义、假设和约定应与本课程材料一致；补充知识也应转换为课程采用的表达方式。
- 课程安排、考核、作业、考试、成绩、名单、日期、地点等事务性信息必须有课程材料依据；没有依据时明确说明，并建议以老师或教务通知为准，不得推测或编造。
- 回答正文和引用的显示名称使用课程标题或讲次名称（如 Lecture 02），不展示文件名、目录或路径。
- 引用课程材料时，在相应结论后标注 [[页面路径|显示名称]]，不手动编号或另列引用清单。训练知识补充不得伪装成课程材料中的结论。
- 数学公式使用 LaTeX：行内用 $...$，独立公式用 $$...$$。
"""


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
    """要求管理员角色。"""
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


class SessionRenameRequest(BaseModel):
    topic: str


class LoginRequest(BaseModel):
    user_id: str
    password: str


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


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
    """返回课程知识库状态和当前用户的用量、配额。"""
    from frankie.agent import wiki_context_budget
    from frankie.vault import summarize_token_log, tokens_used_today

    v = shared_vault_ctx()
    wiki_path = v.wiki_path
    wiki_notes = [
        path for path in wiki_path.rglob("*.md")
        if path.is_file() and not path.is_symlink()
        and path.resolve().is_relative_to(wiki_path.resolve())
        and not any(part.lower() in hidden_content_dirs() for part in path.relative_to(wiki_path).parts)
    ]

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
        "context": wiki_context_budget([v]),
    }


# ---------------------------------------------------------------------------
# 路由：文件树
# ---------------------------------------------------------------------------

def _page_title(post: fm.Post) -> str:
    """课程页面标题：frontmatter title 优先，其次正文首个 H1。"""
    title = post.get("title")
    if title is not None and str(title).strip():
        return str(title).strip()
    for line in post.content.splitlines():
        if line.startswith("# ") and line[2:].strip():
            return line[2:].strip()
    return ""


def _markdown_title(p: Path) -> str:
    try:
        return _page_title(fm.load(str(p)))
    except Exception:
        return ""


def _markdown_heading(p: Path) -> str:
    """提取 Markdown 文件首个 H1 标题，失败时回退到文件名（不含扩展名）。"""
    try:
        for line in p.read_text(encoding="utf-8").splitlines()[:30]:
            if line.startswith("# "):
                return line[2:].strip()
    except OSError:
        pass
    return p.stem


def _sources_payload() -> dict:
    """列出课程原始资料。"""
    from frankie.vault import collect_files

    raw_path = get_vault_ctx().raw_sources_path
    if not raw_path or not raw_path.is_dir() or raw_path.is_symlink():
        return {"files": []}

    # 讲义位于 Wiki 内部的 raw/，浏览时包含该目录。
    paths = [
        p for p in collect_files(raw_path, recursive=True, skip_wiki=False)
        if not p.is_symlink() and p.resolve().is_relative_to(raw_path.resolve())
        and "slides" not in {part.lower() for part in p.relative_to(raw_path).parts}
    ]
    result = []
    for p in paths:
        rel = str(p.relative_to(raw_path))
        try:
            body = p.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            body = ""
        try:
            title = _page_title(fm.loads(body)) or p.stem
        except Exception:
            title = p.stem
        result.append({
            "path": rel,
            "abs_path": str(p),
            "title": title,
            "search_text": f"{title} {rel} {body}".lower(),
        })

    return {"root": str(raw_path), "files": result}


@app.get("/api/sources")
async def api_sources(user: UserIdentity = Depends(get_current_user)) -> dict:
    """列出课程原始资料。"""
    with use_vault_ctx(shared_vault_ctx()):
        return _sources_payload()


def _wiki_files_for(ctx, layer: str) -> list[dict]:
    """读取指定 VaultContext 的 Wiki 目录树（含 frontmatter 元数据）。"""
    wiki_path = ctx.wiki_path
    if not wiki_path.exists():
        return []

    result = []
    for p in sorted(wiki_path.rglob("*.md")):
        if p.is_symlink() or not p.resolve().is_relative_to(wiki_path.resolve()):
            continue
        rel = str(p.relative_to(wiki_path))
        if any(part.lower() in hidden_content_dirs() for part in p.relative_to(wiki_path).parts):
            continue
        try:
            post = fm.load(str(p))
            raw_type  = post.get("type")
            raw_date  = post.get("date")
            raw_tags  = post.get("tags")
            note_type = str(raw_type)  if raw_type  is not None else ""
            title = _page_title(post) or p.stem
            date      = str(raw_date)  if raw_date  is not None else ""
            tags      = list(raw_tags) if isinstance(raw_tags, (list, tuple)) else []
        except Exception:
            note_type, title, date, tags = "", p.stem, "", []
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


@app.get("/api/history")
async def api_list_history(
    limit: int = Query(20, ge=1, le=200),
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """返回当前用户最近会话列表。"""
    sessions = list_sessions(limit=limit, user_id=user.user_id)
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


def _course_file(path: Path, root: Path) -> Path:
    """验证课程文本文件的访问边界。"""
    resolved = path.resolve()
    if not resolved.is_relative_to(root) or "slides" in {
        part.lower() for part in resolved.relative_to(root).parts
    }:
        raise HTTPException(status_code=403, detail="文件不可访问")
    if path.is_symlink() or not resolved.is_file() or resolved.suffix.lower() not in {".md", ".txt"}:
        raise HTTPException(status_code=404, detail="文件不存在")
    return resolved


@app.get("/api/wiki/resolve")
async def api_wiki_resolve(
    title: str,
    source: str | None = None,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """解析课程页面标题或相对于 source 页面的讲义/Wiki 链接。"""
    root = shared_vault_ctx().wiki_path.resolve()
    source_path = _course_file(Path(source), root) if source else None
    parsed = urlparse(title.strip().split("|", 1)[0].replace("\\", "/"))
    if parsed.scheme or parsed.netloc:
        raise HTTPException(status_code=400, detail="需要课程文件链接")
    target = unquote(parsed.path).replace("\\", "/")
    if not target and not (parsed.fragment and source_path):
        raise HTTPException(status_code=404, detail="链接目标为空")

    def result(path: Path) -> dict:
        return {
            "title": _markdown_title(path),
            "abs_path": str(path),
            "rel_path": path.relative_to(root).as_posix(),
            "layer": "course",
        }

    base = source_path.parent if source_path else root
    candidate = (root / target.lstrip("/")) if target.startswith("/") else (base / target)
    if not target:
        return result(source_path)
    if not candidate.suffix:
        candidate = candidate.with_suffix(".md")
    try:
        return result(_course_file(candidate, root))
    except HTTPException as exc:
        # 显式文件路径必须精确匹配；标题引用才进行全库查找。
        if exc.status_code != 404 or "/" in target or (source_path and Path(target).suffix):
            raise

    def normalized(value: str) -> str:
        return re.sub(r"[\s_\-]+", "", value.lower())

    normalized_target = normalized(Path(target).stem if Path(target).suffix.lower() in {".md", ".txt"} else target)
    notes = []
    for note in sorted(root.rglob("*")):
        if note.suffix.lower() not in {".md", ".txt"}:
            continue
        try:
            notes.append(_course_file(note, root))
        except HTTPException:
            continue
    for note in notes:
        candidates = {note.stem, _markdown_heading(note), _markdown_title(note)}
        if normalized_target in {normalized(value) for value in candidates}:
            return result(note)

    # 标题中的中文术语、英文缩写也可用作引用。
    t_ascii = re.sub(r"[^a-z0-9]", "", target.lower())
    for note in notes:
        heading = _markdown_heading(note)
        h_norm = normalized(heading)
        h_ascii = re.sub(r"[^a-z0-9]", "", heading.lower())
        acro = "".join(word[0] for word in re.findall(r"[A-Za-z]+", heading)).lower()
        if (
            (len(normalized_target) >= 4 and (normalized_target in h_norm or h_norm in normalized_target))
            or (len(t_ascii) >= 3 and (t_ascii in h_ascii or h_ascii in t_ascii))
            or (len(t_ascii) >= 2 and (t_ascii == acro or acro.startswith(t_ascii) or t_ascii.startswith(acro)))
        ):
            return result(note)
    raise HTTPException(status_code=404, detail=f"未找到课程页面：{title}")


@app.get("/api/file")
async def api_file(
    path: str,
    user: UserIdentity = Depends(get_current_user),
) -> dict:
    """读取课程讲义或 Wiki 文本。"""
    p = _course_file(Path(path), shared_vault_ctx().wiki_path.resolve())
    return {"path": str(p), "content": p.read_text(encoding="utf-8")}


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

    chat_system_prompt = "\n\n".join(
        part for part in (_WEB_CHAT_SYSTEM, answer_context()) if part
    )

    from frankie.agent import wiki_context_budget
    compact_at = wiki_context_budget([shared_vault_ctx()])["history_compact_at"]
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

    async def generate() -> AsyncGenerator[str]:
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
                status, error = "failed", _error_detail(exc)[1]
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
    from frankie.agent import _BASE_SYSTEM, _load_wiki_context_for

    _check_quota(user)
    vctx = get_vault_ctx()
    wiki_context = _load_wiki_context_for(shared_vault_ctx(), query=req.question) or "（Wiki 目前为空）"

    with use_vault_ctx(shared_vault_ctx()):
        index_text = _load_wiki_index()
    user_prompt = f"问题：{req.question}\n\n---目录索引---\n{index_text}\n\n---知识库内容---\n{wiki_context}"

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
    query_system = (_BASE_SYSTEM + _WEB_QUERY_ADDON).replace("{wiki_path}", str(shared_vault_ctx().wiki_path))
    if injected:
        query_system += "\n\n" + injected
    system, messages = llm.build_messages(query_system, [], user_prompt)

    return ChatStreamResponse(_stream_text_response(system, messages, "query", vctx))


# ---------------------------------------------------------------------------
# 路由：学习情况（仅管理员）
# ---------------------------------------------------------------------------

@app.get("/api/admin/students")
async def api_admin_students(user: Annotated[UserIdentity, Depends(require_admin)]) -> dict:
    return {"students": learning.student_overview()}


@app.get("/api/admin/students/{user_id}/sessions")
async def api_admin_sessions(
    user_id: str, user: Annotated[UserIdentity, Depends(require_admin)],
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict:
    try:
        return {"sessions": learning.student_sessions(user_id, offset)}
    except (LookupError, InvalidUserIdError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/admin/students/{user_id}/sessions/{session_id}")
async def api_admin_session(
    user_id: str, session_id: str, user: Annotated[UserIdentity, Depends(require_admin)],
) -> dict:
    try:
        return {"session": learning.student_session(user_id, session_id)}
    except (LookupError, InvalidUserIdError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/admin/students/{user_id}/attachments/{name}")
async def api_admin_attachment(
    user_id: str, name: str, user: Annotated[UserIdentity, Depends(require_admin)],
) -> FileResponse:
    if not _ATTACHMENT_NAME_RE.fullmatch(name):
        raise HTTPException(status_code=404, detail="附件不存在")
    try:
        root = learning.student_root(user_id)
    except (LookupError, InvalidUserIdError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    path = root / "attachments" / name
    if path.resolve() != path or not path.is_file():
        raise HTTPException(status_code=404, detail="附件不存在")
    return FileResponse(path, media_type=_ATTACHMENT_MIME[Path(name).suffix.lower()])


@app.get("/api/admin/summaries")
async def api_admin_summaries(user: Annotated[UserIdentity, Depends(require_admin)]) -> dict:
    return {"summaries": learning.saved_summaries()}


@app.post("/api/admin/summaries")
async def api_admin_generate_summary(user: Annotated[UserIdentity, Depends(require_admin)]) -> dict:
    try:
        return {"summary": await learning.generate_summary()}
    except (learning.NoNewQuestions, learning.SummaryBusy) as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        code, detail = _error_detail(exc)
        raise HTTPException(status_code=code, detail=detail) from exc


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
        # 状态卡片摘要
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


# ---------------------------------------------------------------------------
# 静态文件托管（生产模式）
# ---------------------------------------------------------------------------

_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@app.get("/api/health")
async def api_health() -> dict:
    """Check course files and the frontend build for deployment readiness."""
    wiki = shared_vault_ctx().wiki_path
    if any(not (wiki / name).is_file() or (wiki / name).is_symlink() for name in ("index.md", "faq.md")) or not (wiki / "raw").is_dir() or (wiki / "raw").is_symlink():
        raise HTTPException(status_code=503, detail="Course Wiki is not ready")
    if not (_FRONTEND_DIST / "index.html").is_file():
        raise HTTPException(status_code=503, detail="Frontend is not built")
    return {"status": "ok"}

if _FRONTEND_DIST.exists():
    # 生产模式：托管构建产物
    app.mount("/", StaticFiles(directory=str(_FRONTEND_DIST), html=True), name="static")


# ---------------------------------------------------------------------------
# CLI 入口（由 pyproject.toml 中 frankie-web 调用）
# ---------------------------------------------------------------------------

def run_web(port: int = 7860, no_open: bool = False, *, host: str = "127.0.0.1") -> None:
    """启动 Web 服务并可选择自动打开浏览器。"""
    import uvicorn
    import webbrowser
    import threading

    browser_host = "localhost" if host in {"0.0.0.0", "::"} else host
    if ":" in browser_host:
        browser_host = f"[{browser_host}]"
    url = f"http://{browser_host}:{port}"
    if not no_open:
        # 延迟 1 秒后打开，确保服务已启动
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    print(f"frankie web UI → {url}")
    print("按 Ctrl+C 停止服务")
    uvicorn.run("frankie.web:app", host=host, port=port, reload=False)
