"""Native DeepSeek Chat Completions, with separate text and tool-call channels."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import aclosing
from dataclasses import dataclass
from typing import Literal

from openai import AsyncOpenAI

from frankie.config import settings


class ProtocolError(RuntimeError):
    """The provider did not finish a valid assistant response."""


# "off" disables thinking; the other values enable it with the given reasoning effort.
ThinkingLevel = Literal["off", "low", "high", "max"]


@dataclass(frozen=True)
class TextDelta:
    text: str


@dataclass(frozen=True)
class ResponseComplete:
    message: dict
    finish_reason: str
    usage: TokenUsage


@dataclass
class TokenUsage:
    """单次 LLM 调用的 token 用量。"""

    prompt_tokens: int
    completion_tokens: int
    model: str

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    @classmethod
    def zero(cls, model: str = "") -> TokenUsage:
        return cls(prompt_tokens=0, completion_tokens=0, model=model)


_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.llm.api_key,
            base_url=settings.llm.base_url,
            timeout=120.0,
        )
    return _client


def build_messages(
    system_prompt: str,
    history: list[dict],
    user_input: str | list[dict],
) -> tuple[str, list[dict]]:
    # Retain tool calls, IDs and reasoning metadata, not just role/content.
    return system_prompt, [*history, {"role": "user", "content": user_input}]


async def stream_response(
    system_prompt: str,
    messages: list[dict],
    *,
    tools: list[dict] | None = None,
    tool_choice: Literal["auto", "none"] = "none",
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
    thinking: ThinkingLevel = "off",
    client: AsyncOpenAI | None = None,
) -> AsyncGenerator[TextDelta | ResponseComplete]:
    """Assemble one response; tool arguments never enter the text channel.

    The completed response is the execution barrier. A disconnected stream has
    no completed response, so its partial tool calls cannot be executed.
    """
    extra_body: dict = {"thinking": {"type": "disabled" if thinking == "off" else "enabled"}}
    if thinking != "off":
        extra_body["reasoning_effort"] = thinking
    request: dict = {
        "model": model or settings.llm.default_model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "max_tokens": max_tokens or settings.llm.max_tokens,
        "stream": True,
        "stream_options": {"include_usage": True},
        "extra_body": extra_body,
    }
    if temperature is not None:
        request["temperature"] = temperature
    if tools:
        request.update(tools=tools, tool_choice=tool_choice)
    text: list[str] = []
    reasoning: list[str] = []
    calls: dict[int, dict] = {}
    finish_reason: str | None = None
    usage = TokenUsage.zero(request["model"])
    stream = await (client or get_client()).chat.completions.create(**request)
    async with stream:
        async for chunk in stream:
            if chunk.usage is not None:
                usage = TokenUsage(
                    chunk.usage.prompt_tokens, chunk.usage.completion_tokens, chunk.model
                )
            for choice in chunk.choices:
                if choice.index != 0:
                    raise ProtocolError("模型返回了意外的多个回答")
                delta = choice.delta
                if delta.content:
                    text.append(delta.content)
                    yield TextDelta(delta.content)
                reasoning_delta = getattr(delta, "reasoning_content", None)
                if reasoning_delta:
                    reasoning.append(reasoning_delta)
                for part in delta.tool_calls or []:
                    call = calls.setdefault(part.index, {
                        "id": "", "type": "function",
                        "function": {"name": "", "arguments": ""},
                    })
                    if part.type and part.type != "function":
                        raise ProtocolError("模型返回了不支持的工具类型")
                    if part.id:
                        if call["id"] and call["id"] != part.id:
                            raise ProtocolError("模型在同一工具调用中更改了 ID")
                        call["id"] = part.id
                    if part.function:
                        name = part.function.name
                        if name:
                            if call["function"]["name"] and call["function"]["name"] != name:
                                raise ProtocolError("模型在同一工具调用中更改了名称")
                            call["function"]["name"] = name
                        call["function"]["arguments"] += part.function.arguments or ""
                if choice.finish_reason is not None:
                    if finish_reason is not None:
                        raise ProtocolError("模型重复结束了同一个回答")
                    finish_reason = choice.finish_reason
    if finish_reason is None:
        raise ProtocolError("模型连接中断，未收到完整回答")
    message: dict = {"role": "assistant", "content": "".join(text)}
    if reasoning:
        message["reasoning_content"] = "".join(reasoning)
    if calls:
        message["tool_calls"] = [calls[index] for index in sorted(calls)]
    yield ResponseComplete(message, finish_reason, usage)


def require_text_response(response: ResponseComplete) -> None:
    if response.finish_reason != "stop" or response.message.get("tool_calls"):
        raise ProtocolError(f"模型未正常完成回答（{response.finish_reason}）")
    if not response.message["content"].strip():
        raise ProtocolError("模型未返回回答内容")


async def chat(
    system_prompt: str,
    messages: list[dict],
    *,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
) -> tuple[str, TokenUsage]:
    """Collect and validate one text-only model response."""
    text: list[str] = []
    usage = TokenUsage.zero(model or settings.llm.default_model)
    async with aclosing(stream_response(
        system_prompt,
        messages,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )) as events:
        async for event in events:
            if isinstance(event, TextDelta):
                text.append(event.text)
            else:
                usage = event.usage
                require_text_response(event)
    return "".join(text), usage


# ---------------------------------------------------------------------------
# 账户余额查询
# ---------------------------------------------------------------------------

def fetch_balance() -> dict:
    """同步查询 DeepSeek 账户余额，返回结构化 dict。

    返回格式::

        # 成功
        {"available": True, "total_balance": "10.00",
         "granted_balance": "0.00", "topped_up_balance": "10.00",
         "currency": "CNY"}

        # 失败
        {"available": False, "reason": "<原因字符串>"}

    reason 取值：
        "api_key_not_set"  — API Key 未配置
        "http_<code>"      — HTTP 状态码非 200
        "<异常信息>"        — 网络/解析异常
    """
    if not settings.llm.api_key:
        return {"available": False, "reason": "api_key_not_set"}
    try:
        import httpx
        resp = httpx.get(
            "https://api.deepseek.com/user/balance",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {settings.llm.api_key}",
            },
            timeout=5.0,
        )
        if resp.status_code == 200:
            infos = resp.json().get("balance_infos", [])
            if infos:
                info = infos[0]
                return {
                    "available": True,
                    "total_balance": info.get("total_balance", "0"),
                    "granted_balance": info.get("granted_balance", "0"),
                    "topped_up_balance": info.get("topped_up_balance", "0"),
                    "currency": info.get("currency", "CNY"),
                }
            return {"available": True, "total_balance": "0", "currency": "CNY"}
        return {"available": False, "reason": f"http_{resp.status_code}"}
    except Exception as e:
        return {"available": False, "reason": str(e)[:120]}
