"""Frankie Agent 核心模块。

实现三大核心操作：
- ingest：摄取新资料，整合进 Wiki
- query：向 Wiki 提问，生成综合答案
- lint：对 Wiki 进行健康检查
"""

from __future__ import annotations

from pathlib import Path

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
            relative_parts = path.relative_to(wiki_path).parts
            if path.name == context.wiki_log_file or any(part.lower() in hidden_content_dirs() for part in relative_parts):
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
import re

from rich.console import Console

from frankie import llm
from frankie.config import VaultContext, get_vault_ctx as _ctx, hidden_content_dirs
from frankie.vault import (
    Note,
    append_log,
    append_token_log,
    append_wiki_note,
    get_source_category,
    read_wiki_note,
    write_wiki_note,
)

console = Console()

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

from frankie.schema import WIKI_PAGE_SCHEMA

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
    """你是 Frankie，一个由 DeepSeek 驱动的个人知识助手。
你负责维护用户的 Obsidian Wiki 知识库。
Wiki 目录：{wiki_path}

你遵循以下原则：
1. 知识积累优先：每次摄取新资料都要更新相关 Wiki 页面，不只是生成摘要
2. 交叉引用：若内容与已有 Wiki 页面有明确关联，用 [[页面名]] 标注；无需强行寻找关联
3. 矛盾标注：用 > ⚠️ 矛盾 格式标注与已有知识相悖的内容
4. 简洁精确：摘要简洁，关键信息不遗漏
5. 中文优先：所有 Wiki 内容用中文撰写，专业术语保留英文
"""
    + _LATEX_EXAMPLES
    + WIKI_PAGE_SCHEMA
)

_INGEST_SYSTEM = (
    _BASE_SYSTEM
    + """
当前任务：摄取新资料并整合进 Wiki。

工作流程：
1. 仔细阅读提供的资料内容
2. 提取关键信息、核心观点、重要实体
3. 生成结构化摘要页面（frontmatter 按 Schema 规范，type: source）
4. 提出该资料引发的值得深究的问题

链接规范（重要）：
- Wiki 内部链接只写文件名，不写路径，格式：[[文件名]]
- 例如：[[极简主义金融改革模型]] 而不是 [[concepts/极简主义金融改革模型.md]]
- Obsidian 会自动根据文件名匹配，无需写完整路径
- 禁止链接到 `_index.md` 或任何目录语境（<!-- 目录语境 --> 块仅作背景参考，不是可链接的 Wiki 页面）

SUMMARY 段结构规范（严格遵守）：
- SUMMARY 段只包含：frontmatter、正文、与已有知识的关系
- 禁止在 SUMMARY 段内写 ## 待探索问题 或任何 QUESTIONS 内容，那些统一放到 QUESTIONS 段输出

输出格式：
---SUMMARY---
[摘要页面的完整 Markdown 内容，含 frontmatter、正文、与已有知识的关系。不含待探索问题。]
---QUESTIONS---
[值得进一步探究的问题列表，每条标注：【原文已有线索】或【需外部文献验证】]
"""
)

_QUERY_SYSTEM = (
    _BASE_SYSTEM
    + """
当前任务：基于 Wiki 内容回答用户问题。

工作流程：
1. 理解用户问题
2. 先阅读 Wiki 索引，判断最相关的页面标题
3. 在提供的 Wiki 内容中检索这些页面的具体信息
4. 综合多个页面的内容给出答案
5. 在答案末尾列出引用来源（[[页面名]] 格式）
6. 仅当答案是对多个页面的深度综合分析、且结论不能从任何单一页面直接读出时，
   才在末尾单独一行标注 ARCHIVABLE: true；
   简单检索、单页引用、或仅整理已有内容不标注

来源约束（严格遵守）：
- 回答必须以 Wiki 内容为唯一依据，不得引入 Wiki 中没有的信息
- 如果 Wiki 中找不到相关内容，直接回答「Wiki 中暂无此内容」，不要推测或补全
- 禁止用训练知识填补 Wiki 的空白，避免用户误以为是已归档知识
"""
)

_LINT_SYSTEM = (
    _BASE_SYSTEM
    + """
当前任务：对 Wiki 进行健康检查。

检查项目：
1. 页面间的逻辑矛盾
2. 被新资料推翻的过时观点
3. 没有入站链接的孤立页面（orphan）
4. 被多次提及但缺少独立页面的重要概念
5. 缺失的交叉引用
6. 可以通过外部搜索补充的数据空白

输出格式：
---ISSUES---
[发现的问题列表，每条说明：类型 | 涉及页面 | 问题描述]
---SUGGESTIONS---
[建议新建的页面或需要补充的内容]
---NEXT_SOURCES---
[建议寻找的新资料方向]
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
    if not index_path.exists():
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
    wiki_files = sorted(wiki_path.rglob("*.md"))
    if not wiki_files:
        return ""

    context_parts: list[str] = []

    # 优先加载 index.md
    index_path = wiki_path / ctx.wiki_index_file
    if index_path.exists():
        context_parts.append(f"=== {ctx.wiki_index_file} ===\n{index_path.read_text(encoding='utf-8')}")

    # 优先加载与问题相关的页面；没有命中时回退到最近修改页面。
    _skip = {ctx.wiki_index_file, ctx.wiki_log_file}
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


def load_layered_wiki_context(
    shared_ctx: VaultContext,
    max_files: int | None = None,
    query: str | None = None,
) -> str:
    """合并共享课程库 + 当前用户个人库的 Wiki 上下文（课程内容在前）。

    空层自动跳过；两层均为空时返回空 Wiki 提示。
    """
    parts: list[str] = []
    shared_text = _load_wiki_context_for(shared_ctx, max_files, query)
    if shared_text:
        parts.append(f"【课程知识库（教学材料，全班共享）】\n{shared_text}")
    personal_text = _load_wiki_context_for(_ctx(), max_files, query)
    if personal_text:
        parts.append(f"【我的知识库（个人笔记）】\n{personal_text}")
    return "\n\n".join(parts) if parts else "（Wiki 目前为空）"


def _update_index(title: str, filename: str, summary_line: str) -> None:
    """更新 Wiki 的 index.md，追加新条目。"""
    from datetime import date

    index_file = _ctx().wiki_index_file
    # 只取文件名 stem，不含路径前缀和扩展名，确保生成 [[文件名]] 而非 [[sources/文件名]]
    stem = Path(filename).stem
    entry = f"- [[{stem}]] — {summary_line} （{date.today()}）\n"
    index_content = read_wiki_note(index_file)

    if index_content is None:
        # 首次创建 index.md
        write_wiki_note(
            index_file,
            f"# Frankie Wiki 索引\n\n## 最近添加\n\n{entry}",
            metadata={"title": "Wiki 索引", "auto_generated": True},
        )
    else:
        append_wiki_note(index_file, entry)


# ---------------------------------------------------------------------------
# 三大核心操作
# ---------------------------------------------------------------------------

async def ingest(
    source_content: str,
    source_title: str,
    *,
    source_path: Path | None = None,
    index_context: str | None = None,
    wide: bool = False,
    stream: bool = True,
    out_console: "Console | None" = None,
) -> str | None:
    """摄取新资料，整合进 Wiki。

    Args:
        source_content: 资料的完整文本内容。
        source_title: 资料标题（用于命名摘要页面和日志）。
        source_path: 原始文件绝对路径，用于写入 ingest_log；为 None 时跳过 log 写入。
        index_context: 来自同目录或祖先目录 _index.md 的上下文内容，为 None 表示无。
        wide: 是否加载更多 Wiki 上下文（50 页 vs 默认 10 页），适合 Wiki 已积累大量内容时。
        stream: 是否流式输出到控制台。
    Returns:
        生成的 Wiki 摘要页相对路径（如 "sources/xxx-2026-06-12.md"），失败时返回 None。
    """
    from frankie.vault import record_ingest

    # wide 模式加载更多 Wiki 上下文，以发现更多交叉引用
    wiki_context = _load_wiki_context(max_files=50 if wide else 10)

    # 构建 user prompt
    index_block = ""
    if index_context:
        index_block = f"\n---目录语境（_index.md）---\n{index_context}\n"

    source_category = get_source_category(source_path) if source_path else None
    source_source = "课本" if source_category == "课本" else "课件" if source_category == "课件" else "资料"
    source_hint = f"来源类型：{source_source}\n" if source_path else ""
    source_instruction = "请在生成的摘要中说明该资料来源，例如：参考课本、参考课件。\n" if source_path else ""

    user_prompt = f"""请处理以下资料：

标题：{source_title}
{source_hint}{source_instruction}{index_block}---资料内容---
{source_content}

---当前 Wiki 状态---
{wiki_context}"""
    system, messages = llm.build_messages(_INGEST_SYSTEM.replace("{wiki_path}", str(_ctx().wiki_path)), [], user_prompt)

    _con = out_console or console
    if stream:
        _con.print(f"\n[cyan]Frankie 正在摄取：{source_title}[/cyan]\n")
        full_response = ""
        stream_iter, usage_box = await llm.chat_stream(system, messages)
        async for chunk in stream_iter:
            _con.print(chunk, end="", markup=False)
            full_response += chunk
        _con.print()
        _usage = usage_box.usage
    else:
        full_response, _usage = await llm.chat(system, messages)

    # 写入 token 消耗日志
    append_token_log(
        command="ingest",
        model=_usage.model,
        prompt_tokens=_usage.prompt_tokens,
        completion_tokens=_usage.completion_tokens,
    )

    # 解析并写入摘要页面，获取生成的 wiki_page 路径
    wiki_page = _parse_and_write_ingest(full_response, source_title, out_console=_con)
    append_log("ingest", source_title)

    # 写入 ingest_log（含 hash、wiki_page）
    if source_path is not None:
        record_ingest(source_path, source_content, ingest_mode="full", wiki_page=wiki_page)

    return wiki_page


def _parse_and_write_ingest(response: str, source_title: str, *, out_console: "Console | None" = None) -> str | None:
    """解析 ingest 响应，写入 Wiki 摘要页面（含 UPDATES/QUESTIONS 追加段）。

    Returns:
        生成的摘要页相对路径（如 "sources/xxx-2026-06-12.md"），未生成时返回 None。
    """
    import re
    from datetime import date

    _con = out_console or console
    wiki_page: str | None = None

    # 提取 SUMMARY 部分
    summary_match = re.search(r"---SUMMARY---\n(.*?)(?=---QUESTIONS---|$)", response, re.DOTALL)
    if not summary_match:
        _con.print("[red]⚠ 未找到 SUMMARY 段，摄取结果可能格式异常。[/red]")
        return None

    summary_content = summary_match.group(1).strip()

    # 去除 LLM 可能包裹的 ```markdown ... ``` 代码块
    code_block_match = re.match(r"^```(?:markdown)?\s*\n(.*?)\n```\s*$", summary_content, re.DOTALL)
    if code_block_match:
        summary_content = code_block_match.group(1).strip()

    # 若 LLM 违规在 SUMMARY 段内写了 ## 待探索问题，先将其剔除，避免与追加段重复
    summary_content = re.sub(
        r"\n{0,2}---\n\n## 待探索问题\b.*$",
        "",
        summary_content,
        flags=re.DOTALL,
    ).rstrip()
    # 同样处理没有 --- 分隔线的裸 ## 待探索问题
    summary_content = re.sub(
        r"\n{0,2}## 待探索问题\b.*$",
        "",
        summary_content,
        flags=re.DOTALL,
    ).rstrip()

    # 提取 QUESTIONS 部分，追加到摘要页末尾
    questions_text: str = ""
    questions_match = re.search(r"---QUESTIONS---\n(.*?)$", response, re.DOTALL)
    if questions_match:
        questions_text = questions_match.group(1).strip()

    if questions_text:
        summary_content = summary_content + "\n\n---\n\n## 待探索问题\n\n" + questions_text

    # 写入文件
    safe_title = re.sub(r'[^\w\u4e00-\u9fff\-_ ]', '', source_title).strip().replace(" ", "-")
    filename = f"{_ctx().wiki_sources_dir}/{safe_title}-{date.today()}.md"
    wiki_path = _ctx().wiki_path
    file_path = wiki_path / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(summary_content, encoding="utf-8")

    _update_index(source_title, filename, f"来自 {source_title} 的摘要")

    # 打印结果
    suffix = "  [cyan]（含待探索问题）[/cyan]" if questions_text else ""
    _con.print(f"\n[green]✓ 已写入：{filename}[/green]{suffix}")

    wiki_page = filename
    return wiki_page


async def query(question: str, *, stream: bool = True, archive: bool = False, wiki_context: str | None = None) -> str:
    """向 Wiki 提问，生成综合答案。

    Args:
        question: 用户问题。
        stream: 是否流式输出。
        archive: 是否将答案归档为新 Wiki 页面。
        wiki_context: 预加载的 Wiki 上下文，为 None 时自动加载。
            chat 模式调用时传入会话缓存，避免重复读盘并保证 DeepSeek KV Cache 命中。
    Returns:
        LLM 的完整回复文本。
    """
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

    # 检查是否归档
    archived = False
    if archive:
        _archive_query_result(question, full_response)
        archived = True
    elif "ARCHIVABLE: true" in full_response:
        # LLM 建议归档，但只有显式 --archive 才真正保存
        # 返回提示信息，让调用方决定是否告知用户
        pass  # archived 保持 False，调用方可通过检查返回值里的 ARCHIVABLE 判断

    append_log("query", question, detail=f"归档：{'是' if archived else '否'}")
    return full_response


def _archive_query_result(question: str, answer: str) -> None:
    """将查询结果归档为 Wiki 页面。"""
    import re
    from datetime import date
    from frankie.schema import make_query_metadata

    safe_q = re.sub(r'[^\w\u4e00-\u9fff\-_ ]', '', question[:40]).strip().replace(" ", "-")
    filename = f"{_ctx().wiki_queries_dir}/{safe_q}-{date.today()}.md"
    content = f"# {question}\n\n{answer.replace('ARCHIVABLE: true', '').strip()}"
    metadata = make_query_metadata(title=question, date=str(date.today()))
    write_wiki_note(filename, content, metadata=metadata)
    _update_index(question, filename, f"查询结果：{question[:30]}...")
    console.print(f"\n[green]✓ 答案已归档：{filename}[/green]")


async def lint(*, stream: bool = True) -> str:
    """对 Wiki 进行健康检查。

    Args:
        stream: 是否流式输出。
    Returns:
        LLM 的完整检查报告。
    """
    wiki_context = _load_wiki_context(max_files=50)
    user_prompt = f"""请对以下 Wiki 进行全面健康检查：

    ---Wiki 内容---
    {wiki_context}
    """
    system, messages = llm.build_messages(_LINT_SYSTEM.replace("{wiki_path}", str(_ctx().wiki_path)), [], user_prompt)

    if stream:
        console.print("\n[cyan]Frankie 正在检查 Wiki 健康状态...[/cyan]\n")
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
        command="lint",
        model=_usage.model,
        prompt_tokens=_usage.prompt_tokens,
        completion_tokens=_usage.completion_tokens,
    )

    append_log("lint", "Wiki 健康检查", detail="自动健检完成")
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
当前模式：自由对话，Wiki 作为唯一知识来源。

来源约束（严格遵守）：
- 回答必须以 Wiki 内容为唯一依据，引用时标注 [[页面名]]
- 如果 Wiki 中找不到相关内容，直接回答「Wiki 中暂无此内容」，不要推测或补全
- 禁止用训练知识填补 Wiki 的空白，避免用户误以为是已归档知识
- 你是 Wiki 的代言人，不是通用助手；用户想要的是他自己的知识，不是你的知识
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


# ---------------------------------------------------------------------------
# 对话归档
# ---------------------------------------------------------------------------

_SAVE_SYSTEM = (
    _BASE_SYSTEM
    + """
当前任务：将对话中的洞见整理为结构化 Wiki 页面。

工作流程：
1. 仔细阅读提供的对话历史
2. 提炼核心观点、结论、发现
3. 生成一个结构清晰的洞见页面

输出格式为完整 Markdown，frontmatter 按 Schema 规范：
---
type: insight
title: <简洁标题，概括核心洞见>
date: <今天日期>
source: chat
tags: [<相关标签>]
---

# <标题>

> <一句话核心结论>

## 主要洞见

<条理清晰的洞见内容>

## 背景与推导

<这些洞见是如何在对话中形成的，简要说明>

## 关联知识

<与 Wiki 已有内容的关联，用 [[页面名]] 标注>
"""
)


async def save_insight(
    history: list[llm.Message],
    *,
    topic: str | None = None,
    stream: bool = True,
) -> str | None:
    """将当前对话历史整理为结构化洞见，写入 insights/ 子目录。

    Args:
        history: 当前对话历史。
        topic: 可选的主题提示，帮助 LLM 聚焦。
        stream: 是否流式输出。
    Returns:
        写入的文件路径，失败时返回 None。
    """
    from datetime import date

    if not history:
        console.print("[yellow]⚠ 当前对话历史为空，无法归档。[/yellow]")
        return None

    # 将对话历史格式化为可读文本
    history_text = "\n\n".join(
        f"{'用户' if m['role'] == 'user' else 'Frankie'}：{m['content']}"
        for m in history
    )
    topic_hint = f"\n\n归档主题提示：{topic}" if topic else ""
    user_prompt = f"请整理以下对话中的洞见：\n\n{history_text}{topic_hint}"

    system, messages = llm.build_messages(
        _SAVE_SYSTEM.replace("{wiki_path}", str(_ctx().wiki_path)), [], user_prompt
    )

    if stream:
        console.print("\n[cyan]Frankie 正在整理对话洞见...[/cyan]\n")
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
        command="save",
        model=_usage.model,
        prompt_tokens=_usage.prompt_tokens,
        completion_tokens=_usage.completion_tokens,
    )

    # 去除可能的 ```markdown 包裹
    import frontmatter
    import re
    content = full_response.strip()
    code_block = re.match(r"^```(?:markdown)?\s*\n(.*?)\n```\s*$", content, re.DOTALL)
    if code_block:
        content = code_block.group(1).strip()

    # 统一由程序补齐并覆盖关键元数据，避免 LLM 输出不规范导致文件无法分类。
    parsed = frontmatter.loads(content)

    # 从 frontmatter 提取 title 作为文件名
    title_match = re.search(r"^title:\s*(.+)$", content, re.MULTILINE)
    if title_match:
        raw_title = title_match.group(1).strip().strip('"\'')
    else:
        raw_title = topic or "对话洞见"

    safe_title = re.sub(r'[^\w\u4e00-\u9fff\-_ ]', '', raw_title).strip().replace(" ", "-")
    filename = f"{_ctx().wiki_insights_dir}/{safe_title}-{date.today()}.md"
    metadata = {
        "type": "insight",
        "title": raw_title,
        "date": str(date.today()),
        "source": "chat",
        "tags": parsed.metadata.get("tags", []),
    }
    file_path = write_wiki_note(filename, parsed.content, metadata=metadata)

    _update_index(raw_title, filename, f"对话洞见：{raw_title[:30]}")
    append_log("save", raw_title, detail="chat 归档")
    console.print(f"\n[green]✓ 洞见已归档：{filename}[/green]")
    return filename
