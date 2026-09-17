"""Course FAQ context, read directly from llm_wiki/faq.md."""

from __future__ import annotations

from frankie.auth import shared_vault_ctx

_DETAIL_FAQ_HEADING = "## Frequently Asked Questions"


def answer_context() -> str:
    """课程行政与考核信息；详细问答由 search_wiki 检索。"""
    path = shared_vault_ctx().wiki_path / "faq.md"
    if not path.is_file() or path.is_symlink():
        return ""
    faq = path.read_text(encoding="utf-8").strip().split(_DETAIL_FAQ_HEADING)[0].strip()
    return f"【课程 FAQ】回答须与以下课程信息保持一致：\n{faq}" if faq else ""


def course_progress() -> str:
    """当前课程进度；用于避免模型追问学生尚未学习的内容。"""
    path = shared_vault_ctx().wiki_path / "progress.md"
    if not path.is_file() or path.is_symlink():
        return ""
    progress = path.read_text(encoding="utf-8").strip()
    return f"【课程进度】当前课程进度如下，超出已覆盖范围的内容学生尚未学习：\n{progress}" if progress else ""
