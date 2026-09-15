"""Frankie CLI entry point."""

from __future__ import annotations

import click

from frankie import __version__

# ---------------------------------------------------------------------------
# CLI 根命令
# ---------------------------------------------------------------------------

@click.group()
@click.version_option(__version__, prog_name="Frankie")
def main() -> None:
    """Operate the Frankie Web application."""


@main.command("rebuild-wiki-index")
def rebuild_wiki_index() -> None:
    """Rebuild shared course search after updating the Wiki checkout."""
    import sqlite3

    from frankie.auth import shared_vault_ctx
    from frankie.wiki_index import rebuild_index

    try:
        path = rebuild_index(shared_vault_ctx())
    except (OSError, ValueError, sqlite3.Error) as exc:
        raise click.ClickException(str(exc)) from exc
    click.echo(f"Wiki search index: {path}")


@main.command()
@click.option("--host", default="127.0.0.1", show_default=True, help="监听地址")
@click.option("--port", default=7860, show_default=True, help="监听端口")
@click.option("--no-open", is_flag=True, default=False, help="不自动打开浏览器")
def web(host: str, port: int, no_open: bool) -> None:
    """启动 Web UI（FastAPI + React）。"""
    try:
        from frankie.web import run_web
    except ImportError as exc:
        raise click.ClickException(
            "Web dependencies are not installed; run: uv sync --extra web"
        ) from exc

    run_web(host=host, port=port, no_open=no_open)


if __name__ == "__main__":
    main()
