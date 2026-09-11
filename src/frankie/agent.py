"""Frankie course knowledge Q&A agent."""

from __future__ import annotations

import re
from pathlib import Path

from rich.console import Console

from frankie import llm
from frankie.config import VaultContext, get_vault_ctx as _ctx, hidden_content_dirs
from frankie.vault import append_token_log

CONTEXT_WINDOW_CHARS = 1_000_000
CONTEXT_COMPACTION_RATIO = 0.65


def wiki_context_budget(contexts: list[VaultContext] | None = None) -> dict[str, int]:
    """Return a character budget based on the Wiki files in the given contexts."""
    selected_contexts = contexts or [_ctx()]
    wiki_chars = 0
    for context in selected_contexts:
        wiki_path = context.wiki_path
        if not wiki_path.exists():
            continue
        for path in wiki_path.rglob("*.md"):
            if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(wiki_path.resolve()):
                continue
            relative_parts = path.relative_to(wiki_path).parts
            if any(part.lower() in hidden_content_dirs() for part in relative_parts):
                continue
            try:
                wiki_chars += len(path.read_text(encoding="utf-8"))
            except OSError:
                continue
    return {
        "window_chars": CONTEXT_WINDOW_CHARS,
        "wiki_chars": wiki_chars,
        "history_compact_at": max(24_000, int((CONTEXT_WINDOW_CHARS - wiki_chars) * CONTEXT_COMPACTION_RATIO)),
    }


console = Console()

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

# 公式输出规范的 LaTeX 示例（用 chr(92) 拼接反斜杠，避开 f-string 的转义问题）
_LATEX_EXAMPLES = (
    "\n\n公式输出规范（重要）：\n"
    "- 行内公式用 $...$ 包裹，例如：质能方程 $E = mc^2$\n"
    "- 块级公式用 $$...$$ 单独成行，例如：\n"
    "  $$\n"
    "  " + chr(92) + "int_0^" + chr(92) + "infty e^{-x^2} dx = " + chr(92) + "frac{" + chr(92) + "sqrt{" + chr(92) + "pi}}{2}\n"
    "  $$\n"
    "- 牛顿第二定律：$F = ma$；正态分布：$N(" + chr(92) + "mu, " + chr(92) + "sigma^2)$；\n"
    "  偏导：$" + chr(92) + "frac{" + chr(92) + "partial f}{" + chr(92) + "partial x}$；求和：$" + chr(92) + "sum_{i=1}^n x_i$\n"
    "- 所有数学、物理、化学、统计、经济等公式必须使用 LaTeX 语法，确保 KaTeX 能正确渲染\n"
)

_BASE_SYSTEM = (
    """你是 Frankie，一个课程知识问答助手。
知识库目录：{wiki_path}

你遵循以下原则：
1. 只使用提供的课程知识库和个人上下文回答，不使用训练知识填补空白
2. 知识库中没有依据时明确说明，不推测或编造
3. 引用具体结论时使用 [[页面名]] 标注来源
4. 涉及课程安排、考核、作业、考试、成绩、日期或地点的问题，没有依据时请用户以老师或教务的最新通知为准
5. 简洁精确，中文优先，专业术语保留英文
"""
    + _LATEX_EXAMPLES
)

_QUERY_SYSTEM = (
    _BASE_SYSTEM
    + """
当前任务：基于知识库内容回答用户问题。

工作流程：
1. 理解用户问题
2. 先阅读知识库索引，判断最相关的页面标题
3. 在提供的知识库内容中检索这些页面的具体信息
4. 综合相关页面的内容给出答案
5. 在答案末尾列出引用来源（[[页面名]] 格式）

来源约束（严格遵守）：
- 回答必须以知识库内容为唯一依据，不得引入知识库中没有的信息
- 如果知识库中找不到相关内容，直接回答「知识库中暂无此内容」，不要推测或补全
- 禁止用训练知识填补知识库的空白
"""
)


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

def _load_wiki_context(max_files: int | None = None) -> str:
    """加载 Wiki 页面内容作为上下文，优先加载 index.md 和最近修改的页面。"""
    text = _load_wiki_context_for(_ctx(), max_files)
    return text if text else "（Wiki 目前为空）"


def _load_wiki_index() -> str:
    """加载当前 Vault 的 Wiki index.md 内容，用于 query 选择最相关页面。"""
    index_path = _ctx().wiki_path / _ctx().wiki_index_file
    if not index_path.is_file() or index_path.is_symlink():
        return "（Wiki 索引文件不存在）"
    return index_path.read_text(encoding="utf-8")


def _load_wiki_context_for(
    ctx: VaultContext,
    max_files: int | None = None,
    query: str | None = None,
) -> str:
    """加载指定 VaultContext 的 Wiki 上下文（不切换当前上下文，纯读文件）。

    Returns:
        拼接后的上下文字符串；该层没有任何页面时返回空串。
    """
    wiki_path = ctx.wiki_path
    if not wiki_path.exists():
        return ""
    wiki_files = sorted(
        p for p in wiki_path.rglob("*.md")
        if not p.is_symlink() and p.resolve().is_relative_to(wiki_path.resolve())
    )
    if not wiki_files:
        return ""

    context_parts: list[str] = []

    # 优先加载 index.md
    index_path = wiki_path / ctx.wiki_index_file
    if index_path.is_file() and not index_path.is_symlink():
        context_parts.append(f"=== {ctx.wiki_index_file} ===\n{index_path.read_text(encoding='utf-8')}")

    # 优先加载与问题相关的页面；没有命中时回退到最近修改页面。
    _skip = {ctx.wiki_index_file}
    other_files = [
        f for f in wiki_files
        if f.name not in _skip
        and not any(part.lower() in hidden_content_dirs() for part in f.relative_to(wiki_path).parts)
    ]
    keywords = [word.lower() for word in re.findall(r"[\u4e00-\u9fff]{2,}|[a-zA-Z0-9_]{2,}", query or "")]

    def score(path: Path) -> tuple[int, float]:
        if not keywords:
            return (0, path.stat().st_mtime)
        try:
            content = path.read_text(encoding="utf-8").lower()
        except OSError:
            return (0, 0)
        haystack = f"{path.as_posix().lower()}\n{content}"
        return (sum(haystack.count(keyword) for keyword in keywords), path.stat().st_mtime)

    other_files.sort(key=score, reverse=True)

    for f in other_files if max_files is None else other_files[:max_files]:
        rel = f.relative_to(wiki_path)
        content = f.read_text(encoding="utf-8")
        context_parts.append(f"=== {rel} ===\n{content}")

    return "\n\n".join(context_parts)


# ---------------------------------------------------------------------------
# Read-only query
# ---------------------------------------------------------------------------

async def query(question: str, *, stream: bool = True, wiki_context: str | None = None) -> str:
    """基于只读知识库回答问题。"""
    index_text = _load_wiki_index()
    ctx = wiki_context if wiki_context is not None else _load_wiki_context()
    user_prompt = f"""问题：{question}

---目录索引---
{index_text}

---Wiki 内容---
{ctx}
"""
    system, messages = llm.build_messages(_QUERY_SYSTEM.replace("{wiki_path}", str(_ctx().wiki_path)), [], user_prompt)

    if stream:
        console.print(f"\n[cyan]Frankie 正在思考：{question}[/cyan]\n")
        full_response = ""
        stream_iter, usage_box = await llm.chat_stream(system, messages)
        async for chunk in stream_iter:
            console.print(chunk, end="", markup=False)
            full_response += chunk
        console.print()
        _usage = usage_box.usage
    else:
        full_response, _usage = await llm.chat(system, messages)

    # 写入 token 消耗日志
    append_token_log(
        command="query",
        model=_usage.model,
        prompt_tokens=_usage.prompt_tokens,
        completion_tokens=_usage.completion_tokens,
    )

    return full_response


# ---------------------------------------------------------------------------
# 对话模式（chat loop 的单轮调用）
# ---------------------------------------------------------------------------

async def chat_turn(
    user_input: str,
    history: list[llm.Message],
    *,
    stream: bool = True,
    wiki_context: str | None = None,
) -> str:
    """普通对话模式的单轮调用，支持历史记忆。

    Args:
        user_input: 用户输入。
        history: 历史对话消息列表。
        stream: 是否流式输出。
        wiki_context: 预加载的 Wiki 上下文字符串。若为 None 则按需加载（兜底）。
            建议在 chat session 启动时加载一次后传入，避免每轮重复读盘
            并保证 DeepSeek KV Cache 前缀字节级一致、稳定命中。
    Returns:
        LLM 回复文本。
    """
    if wiki_context is None:
        wiki_context = _load_wiki_context(max_files=20)
    chat_system = (
        _BASE_SYSTEM
        + """
当前模式：课程问答，知识库作为唯一知识来源。

来源约束（严格遵守）：
- 回答必须以知识库内容为唯一依据，引用时标注 [[页面名]]
- 如果知识库中找不到相关内容，直接回答「知识库中暂无此内容」，不要推测或补全
- 禁止用训练知识填补知识库的空白
- 你是课程知识问答助手，不是通用助手
"""
    )
    # 优化2：wiki_context（最大且最稳定的块）放在 system prompt 最前面，
    # 使其成为每轮请求的公共前缀，最大化 DeepSeek KV Cache 命中的 token 数量。
    system_prompt = (
        f"当前 Wiki 摘要：\n{wiki_context}\n\n"
        + chat_system.replace("{wiki_path}", str(_ctx().wiki_path))
    )
    system, messages = llm.build_messages(system_prompt, history, user_input)

    if stream:
        full_response = ""
        stream_iter, usage_box = await llm.chat_stream(system, messages)
        async for chunk in stream_iter:
            console.print(chunk, end="", markup=False)
            full_response += chunk
        console.print()
        _usage = usage_box.usage
    else:
        full_response, _usage = await llm.chat(system, messages)

    # 写入 token 消耗日志
    append_token_log(
        command="chat",
        model=_usage.model,
        prompt_tokens=_usage.prompt_tokens,
        completion_tokens=_usage.completion_tokens,
    )

    return full_response
