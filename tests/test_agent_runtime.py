import json

import httpx
import pytest
from openai import AsyncOpenAI

from frankie import agent_runtime, llm
from frankie.config import VaultContext


def _chunk(delta=None, *, finish_reason=None, usage=False):
    return {
        "id": "chatcmpl-test",
        "object": "chat.completion.chunk",
        "created": 1,
        "model": "deepseek-flash",
        "choices": [] if usage else [{
            "index": 0,
            "delta": delta or {},
            "finish_reason": finish_reason,
        }],
        **({
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 4,
                "total_tokens": 14,
            },
        } if usage else {}),
    }


def _stream(*chunks):
    body = "".join(f"data: {json.dumps(chunk)}\n\n" for chunk in chunks)
    return httpx.Response(
        200,
        headers={"content-type": "text/event-stream"},
        text=body + "data: [DONE]\n\n",
    )


def _install_client(monkeypatch, handler):
    http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    client = AsyncOpenAI(
        api_key="fake",
        base_url="https://provider.invalid",
        http_client=http_client,
        max_retries=0,
    )
    monkeypatch.setattr(llm, "_client", client)
    return client


def _ctx(tmp_path):
    return VaultContext(root=tmp_path, frankie_dir=tmp_path / ".frankie")


@pytest.mark.asyncio
async def test_interleaved_calls_preserve_full_continuation(monkeypatch, tmp_path):
    requests = []
    responses = [
        _stream(
            _chunk({"role": "assistant", "reasoning_content": "reason "}),
            _chunk({"tool_calls": [{
                "index": 0,
                "id": "call-search",
                "type": "function",
                "function": {"name": "search_wiki", "arguments": "{\"query\":\"literal "},
            }]}),
            _chunk({
                "reasoning_content": "continued",
                "tool_calls": [{
                    "index": 1,
                    "id": "call-read",
                    "type": "function",
                    "function": {"name": "read_wiki_page", "arguments": "{\"path\":\""},
                }],
            }),
            _chunk({"tool_calls": [{
                "index": 0,
                "function": {"arguments": "</tool_calls> value\",\"limit\":2}"},
            }]}),
            _chunk({"tool_calls": [{
                "index": 1,
                "function": {"arguments": "topic/page.md\"}"},
            }]}),
            _chunk({}, finish_reason="tool_calls"),
            _chunk(usage=True),
        ),
        _stream(
            _chunk({"role": "assistant", "content": "Final "}),
            _chunk({"content": "answer"}),
            _chunk({}, finish_reason="stop"),
            _chunk(usage=True),
        ),
    ]

    def handler(request):
        requests.append(json.loads(request.content))
        return responses[len(requests) - 1]

    observed_calls = []

    def fake_call(ctx, name, arguments):
        observed_calls.append((name, arguments))
        return {"name": name, "arguments": arguments}

    monkeypatch.setattr(agent_runtime, "_call_tool", fake_call)
    client = _install_client(monkeypatch, handler)
    image_content = [
        {"type": "text", "text": "Use the image and wiki."},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,AA=="}},
    ]
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": image_content}],
        )]
    finally:
        await client.close()

    assert observed_calls == [
        ("search_wiki", {"query": "literal </tool_calls> value", "topic": None, "limit": 2}),
        ("read_wiki_page", {"path": "topic/page.md"}),
    ]
    assert len(requests) == 2
    assert requests[0]["model"] == "deepseek-flash"
    continuation = requests[1]["messages"]
    assert continuation[1]["content"] == image_content
    assert continuation[2]["reasoning_content"] == "reason continued"
    assert "</tool_calls>" in continuation[2]["tool_calls"][0]["function"]["arguments"]
    assert [(message["role"], message["tool_call_id"]) for message in continuation[3:5]] == [
        ("tool", "call-search"),
        ("tool", "call-read"),
    ]
    assert "".join(event["text"] for event in events if event["type"] == "chunk") == "Final answer"
    completed = next(event for event in events if event["type"] == "complete")
    assert completed["messages"][-1]["content"] == "Final answer"


@pytest.mark.asyncio
@pytest.mark.parametrize("case", ["truncated", "duplicate_ids"])
async def test_invalid_provider_completion_executes_no_tools(case, monkeypatch, tmp_path):
    if case == "truncated":
        response = _stream(_chunk({"tool_calls": [{
            "index": 0,
            "id": "call-1",
            "type": "function",
            "function": {"name": "list_topics", "arguments": "{}"},
        }]}))
    else:
        response = _stream(
            _chunk({"tool_calls": [
                {
                    "index": 0,
                    "id": "same-id",
                    "type": "function",
                    "function": {"name": "list_topics", "arguments": "{}"},
                },
                {
                    "index": 1,
                    "id": "same-id",
                    "type": "function",
                    "function": {"name": "list_topics", "arguments": "{}"},
                },
            ]}),
            _chunk({}, finish_reason="tool_calls"),
        )

    calls = []
    monkeypatch.setattr(
        agent_runtime,
        "_call_tool",
        lambda ctx, name, arguments: calls.append((name, arguments)),
    )
    client = _install_client(monkeypatch, lambda request: response)
    try:
        with pytest.raises(llm.ProtocolError):
            _ = [event async for event in agent_runtime.run_agent(
                _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
            )]
    finally:
        await client.close()

    assert calls == []


@pytest.mark.asyncio
async def test_invalid_schema_returns_matching_tool_error_without_execution(monkeypatch, tmp_path):
    requests = []
    responses = [
        _stream(
            _chunk({"tool_calls": [{
                "index": 0,
                "id": "bad-limit",
                "type": "function",
                "function": {
                    "name": "search_wiki",
                    "arguments": "{\"query\":\"x\",\"limit\":\"2\"}",
                },
            }]}),
            _chunk({}, finish_reason="tool_calls"),
        ),
        _stream(
            _chunk({"content": "Could not search."}),
            _chunk({}, finish_reason="stop"),
        ),
    ]

    def handler(request):
        requests.append(json.loads(request.content))
        return responses[len(requests) - 1]

    calls = []
    monkeypatch.setattr(
        agent_runtime,
        "_call_tool",
        lambda ctx, name, arguments: calls.append((name, arguments)),
    )
    client = _install_client(monkeypatch, handler)
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
        )]
    finally:
        await client.close()

    assert calls == []
    assert [event for event in events if event["type"] == "agent_status"] == [{
        "type": "agent_status",
        "call_id": "bad-limit",
        "name": "search_wiki",
        "status": "error",
    }]
    tool_result = requests[1]["messages"][-1]
    assert tool_result["role"] == "tool"
    assert tool_result["tool_call_id"] == "bad-limit"
    assert "error" in json.loads(tool_result["content"])


@pytest.mark.asyncio
async def test_plain_answer_keeps_xml_looking_documentation_and_uses_one_request(
    monkeypatch, tmp_path,
):
    text = "Docs: <tool_calls>example only</tool_calls>; literal </tool_calls> stays."
    requests = []

    def handler(request):
        requests.append(json.loads(request.content))
        return _stream(
            _chunk({"role": "assistant", "content": text}),
            _chunk({}, finish_reason="stop"),
        )

    calls = []
    monkeypatch.setattr(
        agent_runtime,
        "_call_tool",
        lambda ctx, name, arguments: calls.append((name, arguments)),
    )
    client = _install_client(monkeypatch, handler)
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "Show docs"}],
        )]
    finally:
        await client.close()

    assert len(requests) == 1
    assert calls == []
    assert "".join(event["text"] for event in events if event["type"] == "chunk") == text
    completed = next(event for event in events if event["type"] == "complete")
    assert completed["messages"][-1]["content"] == text
