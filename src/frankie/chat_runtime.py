"""Single-process chat task ownership and bounded, reconnectable notifications."""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import AsyncIterator, Callable, Coroutine
from typing import Any

logger = logging.getLogger(__name__)


class Changes:
    """Keep only the latest change; a skipped revision requires reconciliation."""

    def __init__(self) -> None:
        self.version = 0
        self.value: dict[str, Any] = {}
        self.changed = asyncio.Event()

    def publish(self, **value: Any) -> None:
        self.value = value
        self.version += 1
        previous = self.changed
        self.changed = asyncio.Event()
        previous.set()

    async def wait(self, version: int) -> None:
        if version == self.version:
            await asyncio.wait_for(self.changed.wait(), timeout=20)


class Reply:
    """Visible text of one running turn: the current model round's prose.

    While the agent works, `content` is provisional and a new round replaces
    it through `reset`; the round that ends without tool calls leaves its text
    in place, so it becomes the final answer without any re-rendering.
    """

    def __init__(self, user_id: str, session_id: str, turn_id: str) -> None:
        self.user_id = user_id
        self.session_id = session_id
        self.turn_id = turn_id
        self.content = ""
        self.reasoning = ""
        self.reasoning_seconds = 0.0
        self.reasoning_active = True
        self._started_at = time.monotonic()
        self.round = 0
        self.status = "running"
        self.error: str | None = None
        self.agent_status: dict | None = None
        self.changes = Changes()
        self.task: asyncio.Task[None] | None = None
        self.started = False
        self.stop_requested = False

    def append(self, text: str) -> None:
        self.content += text
        self.agent_status = None
        self.changes.publish()

    def append_reasoning(self, text: str) -> None:
        self.reasoning += text
        self.reasoning_active = True
        self.changes.publish()

    def reset(self) -> None:
        """Withdraw the visible text; subscribers receive the replacement in full."""
        self.content = ""
        self.round += 1
        self.changes.publish()

    def progress(self, event: dict) -> None:
        self.agent_status = event if event["status"] == "running" else None
        self.changes.publish()

    def elapsed_seconds(self) -> float:
        return time.monotonic() - self._started_at

    def finish(self, status: str, error: str | None, *, seconds: float | None = None) -> None:
        self.status, self.error = status, error
        self.reasoning_seconds = self.elapsed_seconds() if seconds is None else seconds
        self.reasoning_active = False
        self.agent_status = None
        self.changes.publish()

    async def stop(self) -> None:
        # Before the producer starts, let it enter its try/finally and observe the
        # flag itself. Repeated Stop requests must not interrupt finalization.
        if not self.stop_requested:
            self.stop_requested = True
            if self.started and self.task and not self.task.done():
                self.task.cancel()
        if self.task:
            await asyncio.shield(self.task)

    async def events(self) -> AsyncIterator[dict | None]:
        sent = 0
        reasoning_sent = 0
        seen_round = -1
        while True:
            version = self.changes.version
            terminal = self.status != "running"
            # Full text on first contact, after a withdrawn round, and at the end.
            reset = seen_round != self.round or terminal
            content = self.content
            reasoning = self.reasoning
            yield {
                "type": "reply", "turn_id": self.turn_id,
                "text": content if reset else content[sent:],
                "reset": reset,
                "reasoning": reasoning if reasoning_sent == 0 or terminal else reasoning[reasoning_sent:],
                "reasoning_reset": reasoning_sent == 0 or terminal,
                "reasoning_active": self.reasoning_active,
                "reasoning_seconds": self.reasoning_seconds,
                "status": self.status, "error": self.error,
                "agent_status": self.agent_status,
            }
            if terminal:
                return
            sent = len(content)
            reasoning_sent = len(reasoning)
            seen_round = self.round
            try:
                await self.changes.wait(version)
            except TimeoutError:
                yield None
            # Coalesce token/progress updates; a slow subscriber retains no queue.
            await asyncio.sleep(0.05)


class ChatRuntime:
    def __init__(self) -> None:
        self.replies: dict[tuple[str, str], Reply] = {}
        self.deleting: dict[tuple[str, str], int] = {}
        self.accounts: dict[str, Changes] = {}
        self.side_tasks: set[asyncio.Task[None]] = set()
        self.stopping = False

    def notify(self, user_id: str, session_id: str, kind: str, **detail: Any) -> None:
        self.accounts.setdefault(user_id, Changes()).publish(
            session_id=session_id, kind=kind, **detail,
        )

    def spawn(self, coro: Coroutine[Any, Any, None], name: str) -> None:
        """Run a short side task (such as naming a chat) that no client waits for."""
        task = asyncio.create_task(coro, name=name)
        self.side_tasks.add(task)

        def finished(task: asyncio.Task[None]) -> None:
            self.side_tasks.discard(task)
            if not task.cancelled() and task.exception() is not None:
                logger.error("Side task %s failed", task.get_name(), exc_info=task.exception())

        task.add_done_callback(finished)

    def start(self, reply: Reply, produce: Callable[[Reply], Coroutine[Any, Any, None]]) -> None:
        key = (reply.user_id, reply.session_id)
        existing = self.replies.get(key)
        if existing and existing.status == "running":
            raise RuntimeError("Chat session already has an active producer")
        self.replies[key] = reply
        reply.task = asyncio.create_task(produce(reply), name=f"chat-{reply.turn_id}")

        def finished(task: asyncio.Task[None]) -> None:
            if self.replies.get(key) is reply:
                del self.replies[key]
            if not task.cancelled() and task.exception() is not None:
                logger.error("Chat producer failed", exc_info=task.exception())
            self.notify(reply.user_id, reply.session_id, "updated")

        reply.task.add_done_callback(finished)
        self.notify(reply.user_id, reply.session_id, "updated")

    async def notifications(self, user_id: str) -> AsyncIterator[dict | None]:
        if self.stopping:
            return
        changes = self.accounts.setdefault(user_id, Changes())
        version = changes.version
        yield {"type": "sync"}
        while not self.stopping:
            try:
                await changes.wait(version)
            except TimeoutError:
                yield None
                continue
            if self.stopping:
                return
            current = changes.version
            event = {"type": "change", **changes.value} if current == version + 1 else {"type": "sync"}
            version = current
            yield event

    async def shutdown(self) -> None:
        # Uvicorn must call this BEFORE waiting for HTTP responses to finish.
        self.stopping = True
        for changes in self.accounts.values():
            changes.publish()
        for task in self.side_tasks:
            task.cancel()
        await asyncio.gather(*(reply.stop() for reply in list(self.replies.values())))


chat_runtime = ChatRuntime()
