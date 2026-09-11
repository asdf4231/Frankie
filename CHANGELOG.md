# Changelog

## 2026-09-12

- Remove personal memory and related APIs.
- Added an admin-only 学习情况 dashboard with read-only access to each student's sessions, questions, assistant answers, response statuses, and attachments; enforce administrator authorization on all dashboard APIs.

## 2026-09-11

- Read course content directly from the configured `llm_wiki` directory, using root-level `index.md` and `faq.md`, with lecture Markdown under `raw/`.
- Keep chat attachments and saved memory in each user's personal workspace; browse course lectures and Wiki pages through the file library.
- Added a deployment script that updates the course checkout, builds the frontend with installed dependencies, and restarts a systemd user service, with local and public readiness checks.
- Documented separate dependency installation commands for initial setup and dependency changes.
- Store account names, roles, and salted password hashes in private `data/auth/users.json`, and use signed session cookies for frontend authentication.
- Default the web server to `127.0.0.1`, with an explicit `--host` option.
- Enforce Wiki path containment and filter symlinks in course file listings, retrieval, and reference resolution.
- Keep runtime data and generated frontend assets out of version control; retain KaTeX fonts through the frontend build.
- Use concise Web-chat instructions: prioritize course materials, allow training-knowledge supplementation after relevant searches, follow course notation, and require course evidence for administrative facts.
- Search and read lecture Markdown through the retrieval tools, with Wiki-first search defaults and code-enforced tool limits and file-access boundaries.
- Display course titles or lecture names in citation lists and tooltips, supporting `[[target|display name]]` while preserving the underlying navigation target.

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
