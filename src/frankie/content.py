"""Course FAQ context, read directly from llm_wiki/faq.md."""

from __future__ import annotations

from datetime import datetime

from frankie.auth import shared_vault_ctx

_DETAIL_FAQ_HEADING = "## Frequently Asked Questions"


def answer_context() -> str:
    """课程行政与考核信息；详细问答由 search_wiki 检索。"""
    path = shared_vault_ctx().wiki_path / "faq.md"
    if not path.is_file() or path.is_symlink():
        return ""
    faq = path.read_text(encoding="utf-8").strip().split(_DETAIL_FAQ_HEADING)[0].strip()
    if not faq:
        return ""
    return "Course FAQ: answers must be consistent with the course information below:\n" + faq


def course_progress() -> str:
    """当前课程进度；用于避免模型追问学生尚未学习的内容。"""
    path = shared_vault_ctx().wiki_path / "progress.md"
    if not path.is_file() or path.is_symlink():
        return ""
    progress = path.read_text(encoding="utf-8").strip()
    if not progress:
        return ""
    today = datetime.now()
    return (
        f"Today: {today:%Y-%m-%d} ({today:%A}).\n"
        "Current course progress; the students have not yet studied "
        "material beyond the covered range:\n"
        + progress
    )
