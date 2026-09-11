"""Frankie CLI entry point."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import click
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from frankie import __version__
from frankie.config import settings

console = Console()

# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def _fetch_deepseek_balance() -> str | None:
    """查询 DeepSeek 账户余额，返回 Rich 格式化字符串。

    Returns:
        Rich 标记字符串（如 "[green]10.00 CNY[/green]"），失败时返回 None。
    """
    from frankie import llm
    result = llm.fetch_balance()
    if not result["available"]:
        reason = result.get("reason", "")
        if reason == "api_key_not_set":
            return None  # 未配置 Key 时静默
        return "[yellow]查询失败[/yellow]"
    total    = result.get("total_balance", "0")
    currency = result.get("currency", "CNY")
    return f"[green]{total} {currency}[/green]"


# ---------------------------------------------------------------------------
# 欢迎语
# ---------------------------------------------------------------------------

WELCOME = """\
[bold cyan]Frankie[/bold cyan] [dim]v{version}[/dim]
[dim]你好！我是 Frankie，你的课程知识问答助手。[/dim]
[dim]Wiki 目录：{wiki_path}[/dim]
[dim]输入 /help 查看可用命令，输入 /quit 退出。[/dim]
"""

CHAT_HELP = """\
[bold]对话内命令：[/bold]
  [cyan]/query <问题>[/cyan]                 向知识库精确提问（不引入训练知识）
  [cyan]/sources[/cyan]                     列出原始资料层的所有文件
  [cyan]/status[/cyan]                      显示知识库状态
  [cyan]/help[/cyan]                        显示此帮助
  [cyan]/quit[/cyan] 或 [cyan]/exit[/cyan]   退出
"""


# ---------------------------------------------------------------------------
# CLI 根命令
# ---------------------------------------------------------------------------

@click.group(invoke_without_command=True)
@click.version_option(__version__, prog_name="Frankie")
@click.pass_context
def main(ctx: click.Context) -> None:
    """Frankie — 由 DeepSeek 驱动的课程知识问答助手。"""
    if ctx.invoked_subcommand is None:
        # 默认进入 chat 模式
        ctx.invoke(chat)


# ---------------------------------------------------------------------------
# chat 命令
# ---------------------------------------------------------------------------

@main.command()
def chat() -> None:
    """进入持续对话模式（默认命令）。"""
    if settings.cli.show_welcome:
        console.print(
            Panel(
                WELCOME.format(version=__version__, wiki_path=settings.vault.wiki_path),
                border_style="cyan",
                expand=False,
            )
        )

    if not settings.llm.api_key:
        console.print("[red]⚠ 未检测到 DEEPSEEK_API_KEY，请在 .env 文件中配置后重启。[/red]")
        sys.exit(1)

    from frankie.agent import chat_turn, _load_wiki_context
    from frankie.llm import Message

    history: list[Message] = []

    # 优化1：会话级缓存——整个 chat session 只加载一次 Wiki 上下文，
    # 保证每轮传入的字符串对象字节级一致，稳定触发 DeepSeek KV Cache 命中。
    console.print("[dim]正在加载 Wiki 上下文...[/dim]", end="\r")
    _session_wiki_context = _load_wiki_context(max_files=20)
    console.print(" " * 30, end="\r")  # 清除提示行

    while True:
        try:
            user_input = console.input("[bold cyan]你 >[/bold cyan] ").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]再见！[/dim]")
            break

        if not user_input:
            continue

        # 内联命令处理
        if user_input.startswith("/"):
            parts = user_input[1:].split(maxsplit=1)
            cmd = parts[0].lower()
            arg = parts[1] if len(parts) > 1 else ""

            if cmd in ("quit", "exit", "q"):
                console.print("[dim]再见！[/dim]")
                break
            elif cmd == "help":
                console.print(CHAT_HELP)
                continue
            elif cmd == "status":
                _print_status()
                continue
            elif cmd == "query":
                if not arg:
                    console.print("[red]用法：/query <问题>[/red]")
                    continue
                # 复用会话缓存，避免重复读盘，保证 KV Cache 命中
                asyncio.run(_run_query(arg, wiki_context=_session_wiki_context))
                continue
            elif cmd == "sources":
                _print_sources()
                continue
            else:
                console.print(f"[red]未知命令：/{cmd}，输入 /help 查看可用命令[/red]")
                continue

        # 普通对话
        console.print("\n[bold cyan]Frankie >[/bold cyan] ", end="")
        response = asyncio.run(chat_turn(user_input, history, stream=True, wiki_context=_session_wiki_context))

        # 更新历史
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": response})

        # 如果配置了最大轮数，裁剪历史
        max_turns = settings.memory.max_turns
        if max_turns > 0 and len(history) > max_turns * 2:
            history = history[-(max_turns * 2):]


# ---------------------------------------------------------------------------
# query 命令
# ---------------------------------------------------------------------------

@main.command()
@click.argument("question")
@click.option("--reason", "-r", is_flag=True, default=False, help="使用 deepseek-reasoner 深度推理")
def query(question: str, reason: bool) -> None:
    """向知识库提出一个问题并获得综合答案。"""
    asyncio.run(_run_query(question, use_reason=reason))


# ---------------------------------------------------------------------------
# status 命令
# ---------------------------------------------------------------------------

@main.command()
def status() -> None:
    """显示 Wiki 和 Vault 的当前状态。"""
    _print_status()


@main.command()
def sources() -> None:
    """只读列出原始资料目录中的所有文件。"""
    _print_sources()


# ---------------------------------------------------------------------------
# 内部异步运行函数
# ---------------------------------------------------------------------------

async def _run_query(
    question: str,
    *,
    use_reason: bool = False,
    wiki_context: str | None = None,
) -> None:
    """执行只读查询操作。"""
    from frankie import llm as llm_module
    from frankie.agent import _load_wiki_context, query as agent_query

    if use_reason:
        ctx = wiki_context if wiki_context is not None else _load_wiki_context()
        from frankie.agent import _QUERY_SYSTEM
        user_prompt = f"问题：{question}\n\n---Wiki 内容---\n{ctx}"
        system, messages = llm_module.build_messages(
            _QUERY_SYSTEM.replace("{wiki_path}", str(settings.vault.wiki_path)), [], user_prompt
        )
        console.print(f"\n[cyan]Frankie（深度推理）正在思考：{question}[/cyan]\n")
        response = await llm_module.reason(system, messages)
        console.print(response)
    else:
        await agent_query(question, wiki_context=wiki_context)


# ---------------------------------------------------------------------------
# 状态显示
# ---------------------------------------------------------------------------

def _print_sources() -> None:
    """列出原始资料目录中的所有文件。"""
    from rich.tree import Tree
    from frankie.vault import collect_files

    raw_path = settings.vault.raw_sources_path
    if not raw_path:
        console.print("[yellow]⚠ 原始资料目录未配置，请在 config/settings.toml 的 raw_sources_dir 填入。[/yellow]")
        return
    if not raw_path.exists():
        console.print(f"[yellow]⚠ 原始资料目录不存在：{raw_path}[/yellow]")
        return

    paths = collect_files(raw_path, recursive=True, skip_wiki=False)
    if not paths:
        console.print(f"[dim]原始资料目录为空：{raw_path}[/dim]")
        return

    tree = Tree(f"[bold cyan]{raw_path.name}/[/bold cyan]  [dim]({len(paths)} 个文件)[/dim]")
    added_branches: dict[str, object] = {}
    for p in paths:
        rel = p.relative_to(raw_path)
        parent = str(rel.parent) if str(rel.parent) != "." else ""
        label = f"[white]{rel.name}[/white]"
        if parent:
            if parent not in added_branches:
                added_branches[parent] = tree.add(f"[cyan]{parent}/[/cyan]")
            branch = added_branches[parent]
        else:
            branch = tree
        branch.add(label)  # type: ignore[union-attr]

    console.print(tree)


def _print_status() -> None:
    """打印 Wiki 和 Vault 的状态信息。"""
    from frankie.vault import list_wiki_notes, summarize_token_log

    vault_path = settings.vault.path
    wiki_path = settings.vault.wiki_path
    raw_dir = settings.vault.raw_sources_path
    wiki_notes = list_wiki_notes()

    v = settings.vault

    # Vault 信息
    vault_table = Table(title="Vault", border_style="cyan", show_header=False, box=None)
    vault_table.add_column("项目", style="bold dim", width=16)
    vault_table.add_column("值")
    vault_table.add_row("路径", str(vault_path))
    vault_table.add_row("状态", "[green]✓ 已找到[/green]" if vault_path.exists() else "[red]✗ 未找到[/red]")
    vault_table.add_row(
        "原始资料目录",
        f"[green]✓[/green] {raw_dir}" if raw_dir and raw_dir.exists() else (
            f"[yellow]⚠ 路径不存在：{raw_dir}[/yellow]" if raw_dir else
            "[dim]未配置 — 在 config/settings.toml 的 raw_sources_dir 填入[/dim]"
        ),
    )

    # Wiki 信息
    wiki_table = Table(title="Wiki", border_style="cyan", show_header=False, box=None)
    wiki_table.add_column("项目", style="bold dim", width=16)
    wiki_table.add_column("值")
    wiki_table.add_row("目录", str(wiki_path))
    wiki_table.add_row("状态", "[green]✓ 已找到[/green]" if wiki_path.exists() else "[yellow]⚠ 尚未创建[/yellow]")
    wiki_table.add_row("页面总数", str(len(wiki_notes)))
    has_index = (wiki_path / v.wiki_index_file).exists() if wiki_path.exists() else False
    wiki_table.add_row(
        "索引",
        "[green]✓[/green]" if has_index else "[dim]✗[/dim]",
    )

    # LLM 信息
    llm_table = Table(title="LLM", border_style="cyan", show_header=False, box=None)
    llm_table.add_column("项目", style="bold dim", width=16)
    llm_table.add_column("值")
    llm_table.add_row("API Key", "[green]✓ 已配置[/green]" if settings.llm.api_key else "[red]✗ 未配置[/red]")
    llm_table.add_row("Base URL", settings.llm.base_url)
    llm_table.add_row("默认模型", settings.llm.default_model)
    llm_table.add_row("推理模型", settings.llm.reasoning_model)

    # 查询 DeepSeek 余额
    balance_info = _fetch_deepseek_balance()
    if balance_info:
        llm_table.add_row("账户余额", balance_info)

    # Token 消耗摘要
    token_summary = summarize_token_log()
    token_table = Table(title="Token 消耗", border_style="cyan", show_header=False, box=None)
    token_table.add_column("项目", style="bold dim", width=16)
    token_table.add_column("值")

    if token_summary["total_calls"] == 0:
        token_table.add_row("累计调用", "[dim]暂无记录[/dim]")
    else:
        total = token_summary["total_tokens"]
        prompt = token_summary["total_prompt_tokens"]
        completion = token_summary["total_completion_tokens"]
        calls = token_summary["total_calls"]

        token_table.add_row(
            "累计调用",
            f"[bold]{calls}[/bold] 次",
        )
        token_table.add_row(
            "累计 tokens",
            f"[bold]{total:,}[/bold]  [dim](输入 {prompt:,} / 输出 {completion:,})[/dim]",
        )

        # 按指令分布
        by_cmd = token_summary["by_command"]
        if by_cmd:
            cmd_parts = [
                f"{cmd} {info['calls']}次/{info['tokens']:,}tk"
                for cmd, info in sorted(by_cmd.items())
            ]
            if cmd_parts:
                token_table.add_row("按指令分布", "  ".join(cmd_parts))

        # 按模型分布
        by_model = token_summary["by_model"]
        if by_model:
            model_parts = [
                f"{mdl.split('deepseek-')[-1]} {info['tokens']:,}tk"
                for mdl, info in by_model.items()
            ]
            token_table.add_row("按模型分布", "  ".join(model_parts))

    console.print()
    console.print(vault_table)
    console.print()
    console.print(wiki_table)
    console.print()
    console.print(llm_table)
    console.print()
    console.print(token_table)
    console.print()


def smoke() -> None:
    """运行离线烟雾测试。"""
    import subprocess

    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_smoke.py", "-v", "-s"],
        cwd=Path(__file__).parent.parent.parent,
    )
    sys.exit(result.returncode)


@main.command()
@click.option("--host", default="127.0.0.1", show_default=True, help="监听地址")
@click.option("--port", default=7860, show_default=True, help="监听端口")
@click.option("--no-open", is_flag=True, default=False, help="不自动打开浏览器")
def web(host: str, port: int, no_open: bool) -> None:
    """启动 Web UI（FastAPI + React）。"""
    try:
        from frankie.web import run_web
    except ImportError:
        console.print(
            "[red]Web 依赖未安装，请运行：pip install -e '.[web]'[/red]"
        )
        sys.exit(1)

    run_web(host=host, port=port, no_open=no_open)


if __name__ == "__main__":
    main()
