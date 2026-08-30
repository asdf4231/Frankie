"""工具调用 XML 文本的解析与清理。

DeepSeek 走 Anthropic 协议时，偶尔不返回结构化 tool_use 块，而是把工具调用以
XML 纯文本形式输出，两种格式并存：

- 裸 <invoke>（Anthropic 原生文本序列化）：
    <invoke name="search_wiki">
      <parameter name="query">...</parameter>
    </invoke>
- 旧式 <tool_calls> 包装（内含 <invoke>）：
    <tool_calls><invoke name="...">...</invoke></tool_calls>

本模块统一处理这两种格式，供 agent_runtime（解析执行）、web（流式剥离）、
memory（历史清理）三处复用，避免各处正则不一致导致漏剥/漏解析。
"""

from __future__ import annotations

import re
from xml.etree import ElementTree as ET

# 单个 <invoke> 块（含旧式 <tool_calls> 包装内的 <invoke>）
_INVOKE_RE = re.compile(r"<invoke\b[^>]*>.*?</invoke>", re.S)
# 旧式 <tool_calls> 整块（剥离时兜底，避免残留外层空壳）
_TOOL_CALLS_RE = re.compile(r"<tool_calls>.*?</tool_calls>", re.S | re.I)


def parse_tool_calls(text: str) -> list[dict]:
    """从模型输出文本中抽取工具调用。

    返回 [{"name": str, "input": dict}, ...]；无调用或解析失败时返回空列表。
    """
    calls: list[dict] = []
    for match in _INVOKE_RE.finditer(text or ""):
        try:
            invoke = ET.fromstring(match.group(0))
        except ET.ParseError:
            continue
        name = (invoke.get("name") or "").strip()
        if not name:
            continue
        params: dict[str, str] = {}
        for param in invoke.iter("parameter"):
            pname = (param.get("name") or "").strip()
            if pname:
                params[pname] = (param.text or "").strip()
        calls.append({"name": name, "input": params})
    return calls


def strip_tool_xml(text: str) -> str:
    """从文本中剥离工具调用 XML（<invoke> 与 <tool_calls> 两种格式）。"""
    if not text:
        return text
    text = _INVOKE_RE.sub("", text)
    text = _TOOL_CALLS_RE.sub("", text)
    return text


# (open, close) 配对；open 取到属性前即可（如 "<invoke"），close 取完整闭合标签。
_TAG_PAIRS: tuple[tuple[str, str], ...] = (
    ("<tool_calls>", "</tool_calls>"),
    ("<invoke", "</invoke>"),
)


class ToolCallFilter:
    """流式输出时剥离模型可能输出的工具调用 XML 文本。

    处理 chunk 边界：若标签被切成两个 chunk，保留疑似 open 标签前缀的尾部，
    等下一块拼齐后再整体剥离。
    """

    def __init__(self) -> None:
        self._buf = ""

    def process(self, chunk: str) -> str:
        self._buf += chunk
        return self._emit(flush=False)

    def flush(self) -> str:
        out = self._emit(flush=True)
        self._buf = ""
        return out

    def _emit(self, flush: bool) -> str:
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
        for open_tag, close_tag in _TAG_PAIRS:
            start = buf.find(open_tag)
            if start < 0:
                continue
            if best[0] < 0 or start < best[0]:
                best = (start, open_tag, close_tag)
        return best

    @staticmethod
    def _partial_prefix_len(buf: str) -> int:
        """buf 末尾与某个 open 标签前缀匹配的最大长度（用于跨 chunk 暂扣）。"""
        keep = 0
        for open_tag, _ in _TAG_PAIRS:
            for k in range(1, len(open_tag)):
                if buf.endswith(open_tag[:k]):
                    keep = max(keep, k)
        return keep
