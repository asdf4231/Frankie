"""Small tool-using Agent runtime for Frankie."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from xml.etree import ElementTree as ET

from frankie import llm
from frankie.config import VaultContext
from frankie.retrieval import list_topics, read_wiki_page, search_wiki

MAX_AGENT_STEPS = 5

TOOLS = [
    {
        "name": "search_wiki",
        "description": "Search the course Wiki. Returns ranked snippets, not full pages.",
        "input_schema": {"type": "object", "properties": {"query": {"type": "string"}, "topic": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]},
    },
    {
        "name": "read_wiki_page",
        "description": "Read a specific Markdown Wiki page returned by search_wiki.",
        "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    {
        "name": "list_topics",
        "description": "List available Wiki topic directories.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


_TOOL_CALLS_RE = re.compile(r"<tool_calls>.*?</tool_calls>", re.S)


def _parse_xml_tool_calls(text: str) -> list[dict]:
    """解析模型输出的 <tool_calls> XML 文本形式的工具调用。

    返回 [{"name": ..., "input": {...}}, ...]；解析失败返回空列表。
    """
    match = _TOOL_CALLS_RE.search(text)
    if not match:
        return []
    try:
        root = ET.fromstring(match.group(0))
    except ET.ParseError:
        return []
    calls: list[dict] = []
    for invoke in root.iter("invoke"):
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



@dataclass
class AgentRun:
    messages: list[dict]
    events: list[dict] = field(default_factory=list)
    tool_usage: list[llm.TokenUsage] = field(default_factory=list)


async def _call_tool(ctx: VaultContext, name: str, arguments: dict) -> dict | list[dict]:
    if name == "search_wiki":
        return [result.as_dict() for result in search_wiki(ctx, str(arguments.get("query", "")), arguments.get("topic"), int(arguments.get("limit", 8)))]
    if name == "read_wiki_page":
        return read_wiki_page(ctx, str(arguments.get("path", "")))
    if name == "list_topics":
        return list_topics(ctx)
    raise ValueError(f"未知工具：{name}")


async def run_agent(
    ctx: VaultContext,
    system_prompt: str,
    messages: list[dict],
) -> AgentRun:
    """Run bounded tool calls, leaving the final answer for streaming."""
    run = AgentRun(messages=list(messages))
    prev_signature: tuple | None = None
    for _ in range(MAX_AGENT_STEPS):
        response = await llm.get_client().messages.create(
            model=llm.settings.llm.default_model,
            system=system_prompt,
            messages=run.messages,  # type: ignore[arg-type]
            tools=TOOLS,  # type: ignore[arg-type]
            max_tokens=llm.settings.llm.max_tokens,
        )
        usage = llm.TokenUsage(response.usage.input_tokens, response.usage.output_tokens, llm.settings.llm.default_model)
        run.tool_usage.append(usage)
        blocks = [block.model_dump() if hasattr(block, "model_dump") else block for block in response.content]
        tool_uses = [block for block in blocks if block.get("type") == "tool_use"]
        # 模型偶尔不返回结构化 tool_use，而是把工具调用输出成 <tool_calls> XML 纯文本，这里一并解析执行
        xml_calls: list[dict] = []
        for block in blocks:
            if block.get("type") == "text":
                xml_calls.extend(_parse_xml_tool_calls(block.get("text", "")))
        if not tool_uses and not xml_calls:
            return run
        # 为 XML 形式的调用合成 tool_use 块，保证 tool_result 有对应的 tool_use_id
        for idx, call in enumerate(xml_calls):
            tool_uses.append({
                "type": "tool_use",
                "id": f"toolu_xml_{idx + 1}",
                "name": call["name"],
                "input": call.get("input", {}),
            })

        signature = tuple(
            (b.get("name"), json.dumps(b.get("input", {}), sort_keys=True)) for b in tool_uses
        )
        if signature == prev_signature:
            # 本轮与上一轮工具调用完全相同：判定无进展，提前结束，避免空转浪费轮次
            break
        prev_signature = signature
        # 只保留工具调用块，丢弃模型在工具调用前的“过程性叙述”，避免其泄漏进上下文/最终回答
        run.messages.append({"role": "assistant", "content": tool_uses})
        tool_results: list[dict] = []
        for block in tool_uses:
            arguments = block.get("input") or {}
            name = block.get("name", "")
            run.events.append({"type": "tool", "name": name, "query": arguments.get("query", ""), "path": arguments.get("path", "")})
            try:
                result = await _call_tool(ctx, name, arguments)
                payload = json.dumps(result, ensure_ascii=False)
            except (OSError, ValueError) as exc:
                payload = json.dumps({"error": str(exc)}, ensure_ascii=False)
            tool_results.append({"type": "tool_result", "tool_use_id": block.get("id", ""), "content": payload})
        # 所有 tool_result 必须聚合在同一条 user 消息里，紧跟在 assistant 之后
        run.messages.append({"role": "user", "content": tool_results})
    return run
