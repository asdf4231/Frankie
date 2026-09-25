"""Wiki 读取及运行时 token 消耗日志、学生提问审计日志。"""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path

from frankie.config import get_vault_ctx as _ctx
from frankie.config import settings as _settings

# 系统级黑名单：无论任何场景都跳过
_SYSTEM_IGNORE_DIRS = frozenset({
    ".venv", "venv", ".env", "node_modules", ".git", ".obsidian",
    ".trash", "__pycache__", ".DS_Store",
})


def collect_files(
    path: Path,
    *,
    recursive: bool = False,
    extensions: list[str] | None = None,
) -> list[Path]:
    """Collect readable source files while skipping system directories."""
    ext_set = set(extensions or [".md", ".txt"])

    if path.is_file():
        return [path] if path.suffix in ext_set else []

    if not path.is_dir():
        return []

    glob_fn = path.rglob if recursive else path.glob
    files: list[Path] = []
    for p in glob_fn("*"):
        # 跳过黑名单目录（检查路径中每一段）
        if any(part in _SYSTEM_IGNORE_DIRS for part in p.parts):
            continue
        if p.is_file() and p.suffix in ext_set:
            files.append(p)
    return sorted(files)


# ---------------------------------------------------------------------------
# Token 消耗日志（.frankie/token_log.json）
# ---------------------------------------------------------------------------

def _token_log_path() -> Path:
    """返回 token 消耗日志文件路径（.frankie/token_log.json）。"""
    log_path = _ctx().require_writable() / "token_log.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    return log_path


def append_token_log(
    command: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> None:
    """向 .frankie/token_log.json 追加一条 LLM 调用记录。

    使用 DeepSeek tokenizer（transformers）离线计算 token 数时应传入准确值；
    通过 API 响应 usage 字段获取时同样适用。

    Args:
        command: 触发来源，如 "chat"、"compact"、"class_summary"。
        model: 使用的模型名称。
        prompt_tokens: 输入 token 数。
        completion_tokens: 输出 token 数。
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "command": command,
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
    }

    log_path = _token_log_path()
    if log_path.exists():
        try:
            records: list[dict] = json.loads(log_path.read_text(encoding="utf-8"))
            if not isinstance(records, list):
                records = []
        except (json.JSONDecodeError, OSError):
            records = []
    else:
        records = []

    records.append(entry)
    log_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# 学生提问审计日志（admin/question_log.jsonl）
# ---------------------------------------------------------------------------

def append_question_log(entry: dict) -> None:
    """向 admin/question_log.jsonl 追加一条学生提问记录（仅学生，不含回答）。

    追加写 + fsync，会话删除不会移除已写入的记录。文件强制 0600，
    仅属主（服务账号）可读。写入失败时抛出 OSError，由调用方决定是否吞掉。
    """
    log_path = _settings.frankie_data_dir / "admin" / "question_log.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        os.fchmod(f.fileno(), 0o600)
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())


# ---------------------------------------------------------------------------
# 学生页面访问日志（admin/page_views.jsonl）
# ---------------------------------------------------------------------------

def append_page_view_log(*, user_id: str, category: str, resource_id: str) -> None:
    """将真实学生的页面访问追加到 admin/page_views.jsonl；会话删除不清理记录。"""
    log_path = _settings.frankie_data_dir / "admin" / "page_views.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now(UTC).isoformat(),
        "user_id": user_id,
        "category": category,
        "resource_id": resource_id,
    }
    with log_path.open("a", encoding="utf-8") as f:
        os.fchmod(f.fileno(), 0o600)
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())


# ---------------------------------------------------------------------------
# Token 日志读取
# ---------------------------------------------------------------------------

def load_token_log() -> list[dict]:
    """加载 .frankie/token_log.json，返回记录列表。

    Returns:
        记录字典列表，每条含 timestamp/command/model/prompt_tokens/completion_tokens/total_tokens。
        文件不存在或解析失败时返回空列表。
    """
    log_path = _token_log_path()
    if not log_path.exists():
        return []
    try:
        data = json.loads(log_path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def tokens_used_today() -> int:
    """统计当前上下文中今天消耗的 token 总数（prompt + completion）。

    用于多用户模式的每日配额检查；记录按 timestamp 的日期前缀匹配。
    """
    today = datetime.now().strftime("%Y-%m-%d")
    return sum(
        r.get("total_tokens", r.get("prompt_tokens", 0) + r.get("completion_tokens", 0))
        for r in load_token_log()
        if str(r.get("timestamp", "")).startswith(today)
    )


def summarize_token_log() -> dict:
    """汇总 token_log.json 中的累计消耗数据。

    Returns:
        {
            "total_calls": int,
            "total_prompt_tokens": int,
            "total_completion_tokens": int,
            "total_tokens": int,
            "by_command": {"chat": {"calls": int, "tokens": int}, ...},
            "by_model": {"deepseek-v4-flash": {"calls": int, "tokens": int}, ...},
        }
    """
    records = load_token_log()

    summary: dict = {
        "total_calls": 0,
        "total_prompt_tokens": 0,
        "total_completion_tokens": 0,
        "total_tokens": 0,
        "by_command": {},
        "by_model": {},
    }

    for r in records:
        pt = r.get("prompt_tokens", 0)
        ct = r.get("completion_tokens", 0)
        tt = r.get("total_tokens", pt + ct)
        cmd = r.get("command", "unknown")
        mdl = r.get("model", "unknown")

        summary["total_calls"] += 1
        summary["total_prompt_tokens"] += pt
        summary["total_completion_tokens"] += ct
        summary["total_tokens"] += tt

        if cmd not in summary["by_command"]:
            summary["by_command"][cmd] = {"calls": 0, "tokens": 0}
        summary["by_command"][cmd]["calls"] += 1
        summary["by_command"][cmd]["tokens"] += tt

        if mdl not in summary["by_model"]:
            summary["by_model"][mdl] = {"calls": 0, "tokens": 0}
        summary["by_model"][mdl]["calls"] += 1
        summary["by_model"][mdl]["tokens"] += tt

    return summary
