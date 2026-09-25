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
            _chunk({"role": "assistant", "reasoning_content": "reason ", "content": "Checking "}),
            _chunk({"content": "the wiki."}),
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
        ("read_wiki_page", {"path": "topic/page.md", "anchor": None}),
    ]
    # The tool-free round is the answer: no readiness round, no answer-only request.
    assert len(requests) == 2
    assert requests[0]["model"] == "deepseek-flash"
    assert requests[0]["messages"][0]["content"].startswith("system\n\nUse the course tools")
    assert requests[0]["tool_choice"] == "auto"
    continuation = requests[1]["messages"]
    assert continuation[0] == requests[0]["messages"][0]
    assert continuation[1]["content"] == image_content
    assert continuation[2]["content"] == "Checking the wiki."
    assert continuation[2]["reasoning_content"] == "reason continued"
    assert "</tool_calls>" in continuation[2]["tool_calls"][0]["function"]["arguments"]
    assert [(message["role"], message["tool_call_id"]) for message in continuation[3:5]] == [
        ("tool", "call-search"),
        ("tool", "call-read"),
    ]
    assert continuation[-1]["role"] == "tool"
    assert requests[1]["tools"] == agent_runtime.TOOLS
    assert requests[1]["tool_choice"] == "auto"
    # Round 1 prose streams, tools run, then the final round replaces it.
    assert [
        (event["type"], event.get("text", event.get("status")))
        for event in events if event["type"] in {"chunk", "reset", "agent_status"}
    ] == [
        ("chunk", "Checking "), ("chunk", "the wiki."),
        ("agent_status", "running"), ("agent_status", "completed"),
        ("agent_status", "running"), ("agent_status", "completed"),
        ("reset", None), ("chunk", "Final "), ("chunk", "answer"),
    ]
    assert [event["type"] for event in events[-4:]] == ["chunk", "chunk", "usage", "complete"]
    assert len([event for event in events if event["type"] == "usage"]) == 2
    completed = next(event for event in events if event["type"] == "complete")
    assert completed["messages"][0]["content"] == "Checking the wiki."
    assert completed["messages"][-1] == {"role": "assistant", "content": "Final answer"}


@pytest.mark.asyncio
async def test_reasoning_streams_before_answer(monkeypatch, tmp_path):
    client = _install_client(monkeypatch, lambda request: _stream(
        _chunk({"reasoning_content": "First "}),
        _chunk({"reasoning_content": "step"}),
        _chunk({"content": "Answer"}),
        _chunk({}, finish_reason="stop"),
    ))
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
        )]
    finally:
        await client.close()

    assert [(event["type"], event.get("text", event.get("seconds"))) for event in events] == [
        ("reasoning_chunk", "First "), ("reasoning_chunk", "step"),
        ("chunk", "Answer"), ("usage", None),
        ("complete", None),
    ]
    assert events[-1]["messages"] == [{
        "role": "assistant", "content": "Answer", "reasoning_content": "First step",
    }]


@pytest.mark.asyncio
async def test_reasoning_from_tool_rounds_is_preserved(monkeypatch, tmp_path):
    responses = [
        _stream(
            _chunk({"reasoning_content": "Find source"}),
            _chunk({"tool_calls": [{
                "index": 0, "id": "call-1", "type": "function",
                "function": {"name": "list_topics", "arguments": "{}"},
            }]}),
            _chunk({}, finish_reason="tool_calls"),
        ),
        _stream(
            _chunk({"reasoning_content": "Explain result"}),
            _chunk({"content": "Answer"}),
            _chunk({}, finish_reason="stop"),
        ),
    ]
    monkeypatch.setattr(agent_runtime, "_call_tool", lambda ctx, name, arguments: [])
    client = _install_client(monkeypatch, lambda request: responses.pop(0))
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
        )]
    finally:
        await client.close()

    assert [e["text"] for e in events if e["type"] == "reasoning_chunk"] == [
        "Find source", "\n\nExplain result",
    ]
    assert events[-1]["messages"][-1]["reasoning_content"] == "Explain result"


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
    assert len(requests) == 2
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
async def test_plain_answer_is_one_request_streamed_unfiltered(monkeypatch, tmp_path):
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
    assert requests[0]["tools"] == agent_runtime.TOOLS
    assert requests[0]["tool_choice"] == "auto"
    assert [event["type"] for event in events] == ["chunk", "usage", "complete"]
    assert events[0]["text"] == text
    assert events[-1]["messages"] == [{"role": "assistant", "content": text}]


def _tool_round(*, call_id: str, text: str = ""):
    return _stream(
        *([_chunk({"role": "assistant", "content": text})] if text else []),
        _chunk({"tool_calls": [{
            "index": 0, "id": call_id, "type": "function",
            "function": {"name": "list_topics", "arguments": "{}"},
        }]}),
        _chunk({}, finish_reason="tool_calls"),
    )


@pytest.mark.asyncio
async def test_each_round_replaces_previous_prose_and_final_round_is_kept(monkeypatch, tmp_path):
    responses = [
        _tool_round(call_id="call-1", text="Looking up the lecture."),
        _tool_round(call_id="call-2"),  # no prose: the previous prose stays visible
        _tool_round(call_id="call-3", text="Reading the growth example."),
        _stream(
            _chunk({"content": "The answer."}),
            _chunk({}, finish_reason="stop"),
        ),
    ]
    requests = []

    def handler(request):
        requests.append(json.loads(request.content))
        return responses[len(requests) - 1]

    monkeypatch.setattr(agent_runtime, "_call_tool", lambda ctx, name, arguments: [])
    client = _install_client(monkeypatch, handler)
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
        )]
    finally:
        await client.close()

    visible = [
        (event["type"], event.get("text")) for event in events if event["type"] in {"chunk", "reset"}
    ]
    assert visible == [
        ("chunk", "Looking up the lecture."),
        ("reset", None), ("chunk", "Reading the growth example."),
        ("reset", None), ("chunk", "The answer."),
    ]
    assert len(requests) == 4
    assert all(request["tool_choice"] == "auto" for request in requests)
    assert len({request["messages"][0]["content"] for request in requests}) == 1
    transcript = events[-1]["messages"]
    assert [message["role"] for message in transcript] == [
        "assistant", "tool", "assistant", "tool", "assistant", "tool", "assistant",
    ]
    assert transcript[0]["content"] == "Looking up the lecture."
    assert transcript[4]["content"] == "Reading the growth example."
    assert transcript[-1] == {"role": "assistant", "content": "The answer."}


@pytest.mark.asyncio
async def test_exhausted_budget_makes_one_tools_disabled_request(monkeypatch, tmp_path):
    responses = [
        _tool_round(call_id=f"call-{index}", text=f"Round {index}.")
        for index in range(agent_runtime.MAX_AGENT_STEPS)
    ] + [_stream(
        _chunk({"content": "Best effort answer."}),
        _chunk({}, finish_reason="stop"),
    )]
    requests = []

    def handler(request):
        requests.append(json.loads(request.content))
        return responses[len(requests) - 1]

    monkeypatch.setattr(agent_runtime, "_call_tool", lambda ctx, name, arguments: [])
    client = _install_client(monkeypatch, handler)
    try:
        events = [event async for event in agent_runtime.run_agent(
            _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
        )]
    finally:
        await client.close()

    assert len(requests) == agent_runtime.MAX_AGENT_STEPS + 1
    assert all(request["tool_choice"] == "auto" for request in requests[:-1])
    fallback = requests[-1]
    assert fallback["tool_choice"] == "none"
    assert fallback["tools"] == agent_runtime.TOOLS
    assert fallback["messages"][0]["content"].startswith(requests[0]["messages"][0]["content"])
    assert "Tools are no longer available" in fallback["messages"][0]["content"]
    assert fallback["messages"][-1]["role"] == "tool"
    assert events[-1]["messages"][-1] == {"role": "assistant", "content": "Best effort answer."}
    assert [e["text"] for e in events if e["type"] == "chunk"][-1] == "Best effort answer."


@pytest.mark.asyncio
@pytest.mark.parametrize("stage", ["auto", "exhausted"])
async def test_tool_call_written_as_text_is_withheld_and_fails(stage, monkeypatch, tmp_path):
    markup = (
        "<｜｜DSML｜｜ calls>\n<｜｜DSML｜｜ invoke name=\"search_wiki\">\n"
        "<｜｜DSML｜｜ parameter name=\"query\" string=\"true\">Bellman</｜｜DSML｜｜ parameter>\n"
        "</｜｜DSML｜｜ invoke>\n</｜｜DSML｜｜ calls>"
    )
    rounds = agent_runtime.MAX_AGENT_STEPS if stage == "exhausted" else 1
    responses = [
        _tool_round(call_id=f"call-{index}", text="Checking.") for index in range(rounds)
    ] + [_stream(
        _chunk({"content": "<｜｜"}),
        _chunk({"content": "DSML｜｜ calls>\n"}),
        _chunk({"content": markup[len("<｜｜DSML｜｜ calls>\n"):]}),
        _chunk({}, finish_reason="stop"),
    )]
    requests = []

    def handler(request):
        requests.append(json.loads(request.content))
        return responses[len(requests) - 1]

    monkeypatch.setattr(agent_runtime, "_call_tool", lambda ctx, name, arguments: [])
    client = _install_client(monkeypatch, handler)
    events = []
    try:
        with pytest.raises(llm.ProtocolError, match="工具调用写进了回答正文"):
            async for event in agent_runtime.run_agent(
                _ctx(tmp_path), "system", [{"role": "user", "content": "question"}],
            ):
                events.append(event)
    finally:
        await client.close()

    assert len(requests) == rounds + 1
    assert requests[-1]["tool_choice"] == ("none" if stage == "exhausted" else "auto")
    # Only the partial prefix reached the screen, and it was withdrawn.
    assert [e for e in events if e["type"] in {"chunk", "reset"}][-3:] == [
        {"type": "reset"}, {"type": "chunk", "text": "<｜｜"}, {"type": "reset"},
    ]
    assert not any("DSML" in e.get("text", "") for e in events)
    assert not any(e["type"] == "complete" for e in events)
