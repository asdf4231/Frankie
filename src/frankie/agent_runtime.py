"""Bounded agent loop over native, structured DeepSeek tool calls."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncGenerator, Callable
from contextlib import aclosing

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr

from frankie import llm
from frankie.config import VaultContext
from frankie.retrieval import list_topics, read_wiki_page, search_wiki

MAX_AGENT_STEPS = 5
MAX_TOOL_CALLS = 20


class ToolArguments(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SearchArguments(ToolArguments):
    query: StrictStr = Field(min_length=1)
    topic: StrictStr | None = None
    limit: StrictInt = Field(default=8, ge=1, le=20)


class ReadArguments(ToolArguments):
    path: StrictStr = Field(min_length=1)


_TOOL_SCHEMAS: dict[str, tuple[type[ToolArguments], str]] = {
    "search_wiki": (SearchArguments, "Search course Wiki snippets; read matching pages for evidence."),
    "read_wiki_page": (ReadArguments, "Read a Markdown Wiki page returned by search_wiki."),
    "list_topics": (ToolArguments, "List available course Wiki topics."),
}
TOOLS = [
    {"type": "function", "function": {
        "name": name, "description": description, "parameters": arguments.model_json_schema(),
    }}
    for name, (arguments, description) in _TOOL_SCHEMAS.items()
]


def _call_tool(ctx: VaultContext, name: str, arguments: dict) -> dict | list[dict]:
    if name == "search_wiki":
        return [result.as_dict() for result in search_wiki(ctx, **arguments)]
    if name == "read_wiki_page":
        return read_wiki_page(ctx, arguments["path"])
    if name == "list_topics":
        return list_topics(ctx)
    raise ValueError(f"未知工具：{name}")


async def run_agent(
    ctx: VaultContext,
    system_prompt: str,
    messages: list[dict],
    *,
    stream_response: Callable[..., AsyncGenerator[llm.TextDelta | llm.ResponseComplete, None]] = llm.stream_response,
) -> AsyncGenerator[dict, None]:
    """Stream text/status, retaining the full transcript for each continuation.

    Tools are executed only after a complete response and valid call IDs. Text
    is never interpreted as instructions, regardless of its XML/DSML contents.
    """
    transcript = list(messages)
    initial_length = len(transcript)
    seen_ids: set[str] = set()
    call_count = 0
    emitted_text = False
    for step in range(MAX_AGENT_STEPS + 1):
        allow_tools = step < MAX_AGENT_STEPS and call_count < MAX_TOOL_CALLS
        prompt = system_prompt
        if not allow_tools:
            prompt += "\n本轮检索额度已用完。请根据已有工具结果回答；缺少资料时明确说明，不要继续检索。"
        response = None
        turn_has_text = False
        async with aclosing(stream_response(
            prompt, transcript, tools=TOOLS, tool_choice="auto" if allow_tools else "none",
        )) as stream:
            async for event in stream:
                if isinstance(event, llm.TextDelta):
                    if not turn_has_text and emitted_text:
                        yield {"type": "chunk", "text": "\n\n"}
                    turn_has_text = True
                    emitted_text = True
                    yield {"type": "chunk", "text": event.text}
                elif isinstance(event, llm.ResponseComplete):
                    response = event
                    yield {"type": "usage", "usage": event.usage}
        if response is None:
            raise llm.ProtocolError("模型未返回完整响应")
        calls = response.message.get("tool_calls", [])
        if response.finish_reason == "stop" and not calls:
            llm.require_text_response(response)
            transcript.append(response.message)
            yield {"type": "complete", "messages": transcript[initial_length:]}
            return
        if response.finish_reason != "tool_calls" or not calls or not allow_tools:
            raise llm.ProtocolError(f"模型未正常完成回答（{response.finish_reason}）")
        ids = [call.get("id") for call in calls]
        if any(not isinstance(call_id, str) or not call_id for call_id in ids):
            raise llm.ProtocolError("工具调用缺少 ID")
        if len(set(ids)) != len(ids) or seen_ids.intersection(ids):
            raise llm.ProtocolError("模型返回了重复的工具调用 ID")
        if call_count + len(calls) > MAX_TOOL_CALLS:
            raise llm.ProtocolError("模型请求的工具数量超过本轮上限")
        seen_ids.update(ids)
        call_count += len(calls)
        transcript.append(response.message)
        for call in calls:
            name = call["function"]["name"]
            status = {"type": "agent_status", "call_id": call["id"], "name": name}
            try:
                if name not in _TOOL_SCHEMAS:
                    raise ValueError(f"未知工具：{name}")
                arguments = _TOOL_SCHEMAS[name][0].model_validate_json(
                    call["function"]["arguments"],
                ).model_dump()
                status.update({key: arguments[key] for key in ("query", "path") if key in arguments})
                yield {**status, "status": "running"}
                # Retrieval is local I/O; do not block other users' event loops.
                result = await asyncio.to_thread(_call_tool, ctx, name, arguments)
                yield {**status, "status": "completed"}
            except (OSError, ValueError) as exc:
                result = {"error": str(exc)}
                yield {**status, "status": "error"}
            transcript.append({
                "role": "tool", "tool_call_id": call["id"],
                "content": json.dumps(result, ensure_ascii=False),
            })
