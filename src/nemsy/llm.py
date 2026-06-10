"""DeepSeek LLM 封装模块（Anthropic 协议）。

使用 anthropic SDK 调用 DeepSeek API 的 Anthropic 兼容接口。
base_url: https://api.deepseek.com/anthropic

协议优势：
- 原生支持 Tool Calls（为后续 MCP 集成铺路）
- 原生支持 thinking 块（deepseek-v4-pro 深度推理）
- 与 Claude 生态完全兼容

支持：流式输出、普通输出、深度推理（thinking）三种调用模式。
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import anthropic

from nemsy.config import settings

# 消息类型别名（Anthropic 格式）
Message = dict[str, str]


# 模块级客户端单例（延迟初始化）
_anthropic_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    """获取全局 AsyncAnthropic 客户端单例。

    API Key 优先级：DEEPSEEK_API_KEY（.env）> ANTHROPIC_API_KEY（环境变量）
    """
    global _anthropic_client
    if _anthropic_client is None:
        import os
        api_key = settings.llm.api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=api_key,
            base_url=settings.llm.base_url,
        )
    return _anthropic_client


def build_messages(
    system_prompt: str,
    history: list[Message],
    user_input: str,
) -> tuple[str, list[dict]]:
    """构建发送给 LLM 的消息结构（Anthropic 格式）。

    Anthropic 协议中 system 是独立参数，不放在 messages 里。

    Args:
        system_prompt: 系统提示词。
        history: 历史对话消息列表。
        user_input: 当前用户输入。
    Returns:
        (system_prompt, messages) 元组。
    """
    messages: list[dict] = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_input})
    return system_prompt, messages


async def chat(
    system_prompt: str,
    messages: list[dict],
    *,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
) -> str:
    """非流式对话调用，返回完整回复文本。

    Args:
        system_prompt: 系统提示词。
        messages: 消息列表（不含 system）。
        model: 模型名，默认使用 settings.llm.default_model。
        max_tokens: 最大输出 token。
        temperature: 温度。
    Returns:
        LLM 回复文本。
    """
    response = await get_client().messages.create(
        model=model or settings.llm.default_model,
        system=system_prompt,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=max_tokens or settings.llm.max_tokens,
        temperature=temperature if temperature is not None else settings.llm.temperature,
    )
    # 提取文本内容（过滤 thinking 块）
    return _extract_text(response.content)


async def chat_stream(
    system_prompt: str,
    messages: list[dict],
    *,
    model: str | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
) -> AsyncIterator[str]:
    """流式对话调用，异步生成回复文本片段。

    Args:
        system_prompt: 系统提示词。
        messages: 消息列表。
        model: 模型名。
        max_tokens: 最大输出 token。
        temperature: 温度。
    Yields:
        逐块返回的文本片段。
    """
    async with get_client().messages.stream(
        model=model or settings.llm.default_model,
        system=system_prompt,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=max_tokens or settings.llm.max_tokens,
        temperature=temperature if temperature is not None else settings.llm.temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def reason(
    system_prompt: str,
    messages: list[dict],
    *,
    max_tokens: int | None = None,
) -> str:
    """使用 deepseek-v4-pro 进行深度推理（thinking 模式）。

    适用于需要综合多文档、复杂分析的场景。
    thinking 块会被自动过滤，只返回最终回复文本。

    Args:
        system_prompt: 系统提示词。
        messages: 消息列表。
        max_tokens: 最大输出 token。
    Returns:
        LLM 最终回复文本（不含 thinking 过程）。
    """
    response = await get_client().messages.create(
        model=settings.llm.reasoning_model,
        system=system_prompt,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=max_tokens or settings.llm.max_tokens,
        temperature=1.0,  # thinking 模式要求 temperature=1
        thinking={"type": "enabled", "budget_tokens": 4096},  # type: ignore[arg-type]
    )
    return _extract_text(response.content)


def _extract_text(content: list) -> str:
    """从 Anthropic 响应的 content 块列表中提取纯文本，跳过 thinking 块。"""
    parts: list[str] = []
    for block in content:
        if hasattr(block, "type"):
            if block.type == "text":
                parts.append(block.text)
            # thinking 块静默跳过
    return "".join(parts)
