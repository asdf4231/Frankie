"""Small tool-using Agent runtime for Frankie."""

from __future__ import annotations

import json
from dataclasses import dataclass, field

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
        if not tool_uses:
            return run
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
