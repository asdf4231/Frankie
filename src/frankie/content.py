"""Course FAQ context, read directly from llm_wiki/faq.md."""

from __future__ import annotations

from frankie.auth import shared_vault_ctx


def answer_context() -> str:
    path = shared_vault_ctx().wiki_path / "faq.md"
    if not path.is_file() or path.is_symlink():
        return ""
    faq = path.read_text(encoding="utf-8").strip()
    return f"【课程 FAQ】回答须与以下课程信息保持一致：\n{faq}" if faq else ""
