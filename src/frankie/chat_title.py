"""Name a new chat from its first question with a separate, thinking-free model call."""

from __future__ import annotations

import re
import unicodedata

from frankie import llm
from frankie.config import settings

# A sidebar row shows roughly 30 Latin or 15 CJK characters at 14px.
MAX_WIDTH = 30
_QUESTION_LIMIT = 1500
_LABEL_PREFIX = re.compile(r"^(?:title|标题)\s*[:：]\s*", re.IGNORECASE)
_QUOTES = "\"'“”‘’「」『』《》"
_TRAILING = " ,;:.!?，。；：！？、"

_SYSTEM = """You name chat conversations for the teaching assistant of a Dynamic Optimization course.
Given the student's first question, reply with a title only.
Rules:
- Use the language of the question (Chinese or English).
- Chinese: 6 to 12 characters. English: 3 to 7 words, at most 30 characters.
- Name the topic itself. No "Question about", no quotes, no ending punctuation, no explanation."""


def _width(char: str) -> int:
    return 2 if unicodedata.east_asian_width(char) in "WF" else 1


def fit_title(text: str) -> str:
    """Return one line that fits the sidebar; Latin text is cut at a word boundary."""
    line = next((item for item in text.splitlines() if item.strip()), "")
    title = _LABEL_PREFIX.sub("", " ".join(line.split())).strip(_QUOTES)
    width = 0
    for index, char in enumerate(title):
        width += _width(char)
        if width > MAX_WIDTH:
            cut = title[:index]
            if " " in cut and not char.isspace():
                cut = cut.rsplit(" ", 1)[0]
            title = cut
            break
    return title.strip(_TRAILING)


async def generate_title(question: str) -> tuple[str, llm.TokenUsage]:
    """Ask the title model for a name; an empty string means it gave nothing usable."""
    text, usage = await llm.chat(
        _SYSTEM,
        [{"role": "user", "content": question[:_QUESTION_LIMIT]}],
        model=settings.llm.title_model,
        max_tokens=60,
        temperature=0.3,
    )
    return fit_title(text), usage
