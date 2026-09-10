"""工具调用文本的解析与清理。

DeepSeek 走 Anthropic 协议时，偶尔不返回结构化 tool_use 块，而是把工具调用以
纯文本形式输出。已知三种写法：

- 裸 <invoke>（Anthropic 原生文本序列化）：
    <invoke name="search_wiki">
      <parameter name="query">...</parameter>
    </invoke>
- 旧式 <tool_calls> 包装（内含 <invoke>）：
    <tool_calls><invoke name="...">...</invoke></tool_calls>
- DeepSeek 原生 DSML 标记（标签名前带竖线分隔符）：
    <|DSML|tool_calls><|DSML|invoke name="read_wiki_page">
      <|DSML|parameter name="path" string="true">a/b.md</|DSML|parameter>
    </|DSML|invoke></|DSML|tool_calls>

本模块统一处理这三种格式，供 agent_runtime（解析执行）、web（流式剥离）、
memory（历史清理）三处复用，避免各处理则不一致导致漏剥离/漏解析。
"""

from __future__ import annotations

import re
from xml.etree import ElementTree as ET

# DSML 分隔符：<｜DSML｜invoke / </｜DSML｜invoke，兼容 ASCII 竖线、空格写法
_DSML_SEP = r"(?:[|\uff5c]\s*)+DSML(?:\s*[|\uff5c])+"
# 只处理紧跟 < 或 </ 之后的分隔符，避免误伤正文里的竖线（如 Markdown 表格）
_DSML_TAG_RE = re.compile(r"<(/?)" + _DSML_SEP)
# 裸分隔符（连尖括号都被吃掉的情况），剥离残留时清理
_DSML_LEFTOVER_RE = re.compile(_DSML_SEP)

# 工具标签集合（三种写法归一化后共用）
_TOOL_TAGS = "invoke|tool_calls|parameter|result|tool_result|function_calls"

# 完整 <invoke>...</invoke> 块
_INVOKE_RE = re.compile(r"<invoke\b[^>]*>.*?</invoke>", re.S | re.I)
# 旧式 <tool_calls> 整块（剥离时兜底，避免残留外层空壳）
_TOOL_CALLS_RE = re.compile(r"<tool_calls\b[^>]*>.*?</tool_calls>", re.S | re.I)
# 残留的半截标签（防止整块剥离后仍有 <invoke .../> 、</parameter> 等碎片漏出）
_TAG_FRAGMENT_RE = re.compile(r"</?(?:" + _TOOL_TAGS + r")\b[^>]*>", re.I | re.S)
# 标签名前的尖括号被吞掉时的孤儿标签：invoke name="x">、tool_calls>
_ORPHAN_TAG_RE = re.compile(
    r"(?<![</\w])(?:tool_calls|invoke|parameter)(?:\s+\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'))*\s*>",
    re.I,
)
# <parameter name="x">内容</parameter>
_PARAM_RE = re.compile(r"<parameter\b([^>]*)>(.*?)(?:</parameter>|$)", re.I | re.S)
# <invoke name="x">
_INVOKE_OPEN_RE = re.compile(r"<invoke\b([^>]*)>", re.I | re.S)
# name="x" / name='x'
_NAME_ATTR_RE = re.compile(r"""\bname\s*=\s*(?:"([^"]*)"|'([^']*)')""")


def normalize_tool_markup(text: str) -> str:
    """把 DSML 标记归一化成普通 XML 标签：<｜DSML｜invoke → <invoke。

    只处理紧跟在 < 或 </ 之后的分隔符，正文中的竖线不受影响。
    """
    if not text or "DSML" not in text:
        return text
    return _DSML_TAG_RE.sub(r"<\1", text)


def _attr_name(raw: str) -> str:
    """从标签属性串中取 name 值。"""
    match = _NAME_ATTR_RE.search(raw or "")
    if not match:
        return ""
    return (match.group(1) if match.group(1) is not None else match.group(2) or "").strip()


def _parse_invoke_et(block: str) -> dict | None:
    """用 ElementTree 解析单个 <invoke> 块（结构完整时优先走这条）。"""
    try:
        invoke = ET.fromstring(block)
    except ET.ParseError:
        return None
    name = (invoke.get("name") or "").strip()
    if not name:
        return None
    params: dict[str, str] = {}
    for param in invoke.iter("parameter"):
        pname = (param.get("name") or "").strip()
        if pname:
            params[pname] = (param.text or "").strip()
    return {"name": name, "input": params}


def _parse_invoke_fallback(block: str) -> dict | None:
    """正则兜底解析 <invoke> 块（内容含未转义 & 、< 等导致 XML 不合法时）。"""
    open_match = _INVOKE_OPEN_RE.search(block or "")
    if not open_match:
        return None
    name = _attr_name(open_match.group(1))
    if not name:
        return None
    params: dict[str, str] = {}
    for param in _PARAM_RE.finditer(block[open_match.end():]):
        pname = _attr_name(param.group(1))
        if pname:
            params[pname] = (param.group(2) or "").strip()
    return {"name": name, "input": params}


def parse_tool_calls(text: str) -> list[dict]:
    """从模型输出文本中抽取工具调用。

    返回 [{"name": str, "input": dict}, ...]；无调用或解析失败时返回空列表。
    支持 <invoke>、<tool_calls> 包装、DeepSeek DSML 三种写法。
    """
    raw = normalize_tool_markup(text or "")
    calls: list[dict] = []
    for match in _INVOKE_RE.finditer(raw):
        call = _parse_invoke_et(match.group(0)) or _parse_invoke_fallback(match.group(0))
        if call:
            calls.append(call)
    return calls


def _cut_unterminated(text: str) -> str:
    """截掉末尾未闭合的 <invoke>/<tool_calls> 块（流被截断时防止标记漏出）。"""
    for open_tag, close_tag in (("<tool_calls", "</tool_calls>"), ("<invoke", "</invoke>")):
        start = text.lower().rfind(open_tag)
        while start != -1:
            if close_tag.lower() in text[start:].lower():
                break
            text = text[:start]
            start = text.lower().rfind(open_tag)
    return text


def strip_tool_xml(text: str) -> str:
    """从文本中剥离工具调用标记（三种写法：<invoke>、<tool_calls>、DSML）。"""
    if not text:
        return text
    out = normalize_tool_markup(text)
    out = _INVOKE_RE.sub("", out)
    out = _TOOL_CALLS_RE.sub("", out)
    out = _cut_unterminated(out)
    out = _TAG_FRAGMENT_RE.sub("", out)
    out = _DSML_LEFTOVER_RE.sub("", out)
    out = _ORPHAN_TAG_RE.sub("", out)
    return out.strip()


def has_tool_markup(text: str) -> bool:
    """文本里是否还残留工具调用标记（用于最终作答的兜底判断）。"""
    if not text:
        return False
    raw = text
    norm = normalize_tool_markup(raw)
    if _TAG_FRAGMENT_RE.search(norm) or _INVOKE_OPEN_RE.search(norm):
        return True
    if _DSML_LEFTOVER_RE.search(raw):
        return True
    return bool(_ORPHAN_TAG_RE.search(norm))


# (open, close) 配对；open 取到属性前即可（如 "<invoke"），close 取完整闭合标签
_TAG_PAIRS: tuple[tuple[str, str], ...] = (
    ("<tool_calls", "</tool_calls>"),
    ("<invoke", "</invoke>"),
)

# 跨 chunk 暂扣用：可能是一个工具标记开头的候选前缀（含 DSML 的多种写法）
_TAG_NAMES = ("tool_calls", "invoke", "parameter")
_DSML_SEPS = (
    "",
    "|DSML|",
    "||DSML||",
    "| | DSML | |",
    "\uff5cDSML\uff5c",
    "\uff5c\uff5cDSML\uff5c\uff5c",
    "\uff5c \uff5c DSML \uff5c \uff5c",
)


def _build_hold_prefixes() -> frozenset[str]:
    """所有"可能还没收全的标记开头"的字符串前缀集合。"""
    out: set[str] = set()
    for sep in _DSML_SEPS:
        for name in _TAG_NAMES:
            for base in ("<" + sep + name, "</" + sep + name, sep + name):
                if not base:
                    continue
                out.update(base[:k] for k in range(1, len(base) + 1))
    return frozenset(out)


_HOLD_PREFIXES = _build_hold_prefixes()
_HOLD_MAX = max(len(item) for item in _HOLD_PREFIXES)


class ToolCallFilter:
    """流式输出时剥离模型可能输出的工具调用标记文本。

    处理两种情况：
    - DSML 标记：先把 <｜DSML｜invoke 归一化成 <invoke>，再按普通标签剥离；
    - chunk 边界：若标签被切成两块，保留疑似 open 标签前缀的尾部，
      等下一块拼齐后再整体剥离。
    """

    def __init__(self) -> None:
        self._buf = ""

    def process(self, chunk: str) -> str:
        self._buf += chunk or ""
        return self._emit(flush=False)

    def flush(self) -> str:
        out = self._emit(flush=True)
        self._buf = ""
        return out

    def _emit(self, flush: bool) -> str:
        self._buf = normalize_tool_markup(self._buf)
        self._buf = _DSML_LEFTOVER_RE.sub("", self._buf)
        self._buf = _ORPHAN_TAG_RE.sub("", self._buf)
        out = ""
        buf = self._buf
        while True:
            start, open_tag, close_tag = self._find_earliest(buf)
            if start < 0:
                # 没有完整 open 标签：保留可能被 chunk 切开的半个 open 前缀
                keep = 0 if flush else self._partial_prefix_len(buf)
                cut = len(buf) - keep
                out += buf[:cut]
                buf = buf[cut:]
                break
            out += buf[:start]
            close_pos = buf.find(close_tag, start + len(open_tag))
            if close_pos < 0:
                # open 已出现但 close 未到：从 open 起暂扣，等 close 拼齐
                buf = buf[start:]
                break
            buf = buf[close_pos + len(close_tag):]
            continue
        self._buf = buf
        return out

    @staticmethod
    def _find_earliest(buf: str) -> tuple[int, str, str]:
        """返回最早出现的 open 标签及其 (start, open, close)；无则 (-1, "", "")。"""
        best: tuple[int, str, str] = (-1, "", "")
        lowered = buf.lower()
        for open_tag, close_tag in _TAG_PAIRS:
            start = lowered.find(open_tag)
            if start < 0:
                continue
            if best[0] < 0 or start < best[0]:
                best = (start, open_tag, close_tag)
        return best

    @staticmethod
    def _partial_prefix_len(buf: str) -> int:
        """buf 末尾可暂扣的最长长度（可能还没收全的标记开头）。"""
        limit = min(len(buf), _HOLD_MAX)
        for k in range(limit, 0, -1):
            if buf[-k:] in _HOLD_PREFIXES:
                return k
        return 0
