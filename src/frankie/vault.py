"""Wiki 读取及运行时 token 消耗日志。"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import frontmatter

from frankie.config import get_vault_ctx as _ctx


# ---------------------------------------------------------------------------
# 数据类型
# ---------------------------------------------------------------------------

class Note:
    """代表一个 Obsidian 笔记文件。"""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._post: frontmatter.Post | None = None

    @property
    def relative_path(self) -> Path:
        """相对于 Vault 根目录的路径。"""
        return self.path.relative_to(_ctx().path)

    @property
    def title(self) -> str:
        """笔记标题，优先取 frontmatter 中的 title，否则用文件名。"""
        post = self._load()
        return str(post.get("title", self.path.stem))

    @property
    def content(self) -> str:
        """笔记正文（不含 frontmatter）。"""
        return self._load().content

    @property
    def metadata(self) -> dict:
        """Frontmatter 元数据。"""
        return dict(self._load().metadata)

    @property
    def full_text(self) -> str:
        """原始文件全文（含 frontmatter）。"""
        return self.path.read_text(encoding="utf-8")

    def _load(self) -> frontmatter.Post:
        if self._post is None:
            self._post = frontmatter.load(str(self.path))
        return self._post

    def __repr__(self) -> str:
        return f"<Note {self.relative_path}>"


# ---------------------------------------------------------------------------
# Vault 读操作
# ---------------------------------------------------------------------------

def read_note(path: Path) -> Note:
    """读取单个笔记。

    Args:
        path: 笔记的绝对路径或相对于 Vault 根目录的路径。
    """
    if not path.is_absolute():
        path = _ctx().path / path
    if not path.exists():
        raise FileNotFoundError(f"笔记不存在：{path}")
    return Note(path)


def search_notes(query: str, directory: Path | None = None) -> list[Note]:
    """在笔记内容中全文搜索关键词（大小写不敏感）。

    Args:
        query: 搜索关键词。
        directory: 搜索范围，默认为 raw_sources_path，未配置则报错。
    """
    root = directory or _ctx().raw_sources_path
    if root is None:
        raise ValueError("search_notes() 需要传入 directory 或在 settings.toml 中配置 raw_sources_dir")
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    results: list[Note] = []
    for path in collect_files(root, recursive=True):
        try:
            note = Note(path)
            if pattern.search(note.full_text):
                results.append(note)
        except Exception:
            continue
    return results


# ---------------------------------------------------------------------------
# Wiki 读操作
# ---------------------------------------------------------------------------

def list_wiki_notes() -> list[Path]:
    """列出 Wiki 目录下所有 Markdown 笔记（递归）。"""
    wiki = _ctx().wiki_path
    if not wiki.exists():
        return []
    return sorted(wiki.rglob("*.md"))


# 系统级黑名单：无论任何场景都跳过（不可配置）
# frankie-wiki 通过 _ctx().wiki_dir 动态注入，避免硬编码
_SYSTEM_IGNORE_DIRS = frozenset({
    ".venv", "venv", ".env", "node_modules", ".git", ".obsidian",
    ".trash", "__pycache__", ".DS_Store",
})


def collect_files(
    path: Path,
    *,
    recursive: bool = False,
    extensions: list[str] | None = None,
    ignore_dirs: frozenset[str] | None = None,
    skip_wiki: bool = True,
) -> list[Path]:
    """从文件或目录收集可读取的文件列表。

    黑名单优先级（合并后生效）：
      系统级（_SYSTEM_IGNORE_DIRS） + 用户级（_ctx().raw_sources_ignore） + ignore_dirs 参数

    Args:
        path: 文件或目录路径。
        recursive: 目录模式下是否递归穿透子目录。
        extensions: 限定扩展名列表，默认 ['.md', '.txt']。
        ignore_dirs: 额外要跳过的目录名集合（调用方传入，叠加到黑名单上）。
        skip_wiki: 是否跳过 wiki 目录；当扫描根目录位于 wiki 内部时应传 False。
    Returns:
        按路径排序的文件列表（不含目录）。
    """
    if extensions is None:
        extensions = [".md", ".txt"]
    ext_set = set(extensions)

    # 合并三层黑名单：系统级 + wiki_dir（动态）+ 用户配置 + 调用方传入
    skip_dirs = _SYSTEM_IGNORE_DIRS | set(_ctx().raw_sources_ignore)
    if skip_wiki:
        skip_dirs = skip_dirs | {_ctx().wiki_dir}
    if ignore_dirs:
        skip_dirs = skip_dirs | ignore_dirs

    if path.is_file():
        return [path] if path.suffix in ext_set else []

    if not path.is_dir():
        return []

    glob_fn = path.rglob if recursive else path.glob
    files: list[Path] = []
    for p in glob_fn("*"):
        # 跳过黑名单目录（检查路径中每一段）
        if any(part in skip_dirs for part in p.parts):
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
        command: 触发来源，如 "query"、"chat"、"compact"。
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
