# Changelog

## 2026-09-10

- Switched to native DeepSeek Chat Completions with `deepseek-flash` as the default chat model and the OpenAI SDK replacing the Anthropic SDK.
- Reworked chat into a structured tool loop with validated arguments, preserved call IDs, live tool progress, and direct answer streaming without a separate regeneration call.
- Removed XML/DSML tool-call parsing, text cleanup, and message flattening.
- `/api/chat` now automatically saves each question and its completed, failed, or stopped reply in the database, replacing the browser's separate `/api/history/save` requests. Older conversations are not imported into the new history tables.
- Preserve full tool transcripts and provider reasoning metadata for completed turns. Stopped and failed turns retain their submitted input, attachments, and visible reply text for follow-up questions; unfinished tool-call sequences are not replayed.
- Estimate image context cost separately from base64 payload size, preventing large image files from unnecessarily triggering history compression and losing image context on follow-up questions.
- Added explicit streaming failure states, cleanup for disconnects after streaming starts, and protection against stale frontend callbacks.
- Fixed Stop → immediate resend conflicts by waiting for the backend to finish the previous turn before submitting the next message.
- Added new conversations to the session list immediately and prevented stale history refreshes from removing newer entries.
- Added offline regression tests for structured tool calls, history persistence, stream cancellation, and history compression; rebuilt the frontend.
