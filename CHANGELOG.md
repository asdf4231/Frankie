# Changelog

## 2026-09-13 — Typography polish

- Use installed bilingual fonts and modest 18px chat headings with symmetric spacing.

## 2026-09-13 — Frontend Redesign Phase 5

- Keep Learning's student and session lists beside top-aligned records, with prominent display names, secondary roster login IDs, and responsive drill-down navigation.
- Give Wiki and lectures full-height workspaces, with navigation controls inside their search and reader toolbars.
- Present substantive Wiki and lecture content while retaining source metadata for search and topic ordering.
- Unify Status, Settings and Login with shared design tokens; keep password changes available independently of admin-only configuration loading.

## 2026-09-13 — Frontend Redesign Phase 4

- Use readable, lecture-ordered Wiki topics and restore reader positions on Back/Forward; keep lecture reading focused on slide content.
- Rebuild Wiki and lecture browsing with full-text search, grouped lists, metadata-aware readers, and mobile navigation; share Markdown and relative-link resolution with chat.
- Cache the last ten documents and cancel stale loads; use a YAML parser for frontmatter.

## 2026-09-12 — Frontend Redesign Phase 3

- Inline citations show compact, title-only tooltips using the linked page's frontmatter or H1 title; share cached resolution with navigation.
- Use neutral, surface-level focus indicators, focus the composer from its blank area, and keep the copy action visible.
- Center chat in a 768px column with a persistent composer, flat messages, copy and citation controls, and scroll-follow controls; use shared SVG icons throughout the UI.
- Redesign UI to be flat, minimal and premium in the spirit of ChatGPT / DeepSeek.

## 2026-09-12

- Disable Web-chat thinking while retaining reasoning support.
- Remove personal memory and related APIs.
- Added an admin-only 学习情况 dashboard with read-only access to each student's sessions, questions, assistant answers, response statuses, and attachments; enforce administrator authorization on all dashboard APIs.
- Initialize and validate all account history schemas at startup, preserving chats; distinguish summary storage errors from model failures.
- Pin Python 3.14 and Node 24.19.0 for local development and deployment, lock Python dependencies in `uv.lock`, sync them with `uv sync --locked`, and report database, filesystem, model, and unexpected failures separately.
- Install `uv` outside the environment it manages, require pnpm 11, sync frontend dependencies on every deploy, and take Python and npm packages from TUNA and npmmirror, since nodejs.org is unreachable and PyPI downloads about 27 KB/s on the server.
- Point the pinned Node runtime entry in `pnpm-lock.yaml` at the npmmirror archives, since a frozen install downloads the recorded URL and never consults the mirror setting.
- Frontend performance hotfix: removed the full-screen noise overlay, idle glow/breathe/spin animations, pointer spotlight and view slide-in; memoised Markdown rendering; streamed chunks are batched per frame; the composer owns its draft so typing no longer re-renders the conversation. Typing and attaching work while a reply is generating, and Enter no longer sends during IME composition.
- Frontend foundation: design tokens with light and dark palettes, base and shared component styles, an inline SVG icon set, a query-string router with separate Wiki and 课件 views (citations open the matching tab), cached course lists and shared Markdown typography; system font stack replaces Google Fonts; the old stylesheet is now a cascade layer that is deleted view by view.
- New app shell: a collapsible sidebar with 新对话, Wiki, 课件, admin pages, chat history grouped by day with inline rename and two-step delete, and a user menu; a slide-in drawer replaces the bottom tab bar on phones. The open session is part of the URL, a fresh load starts an empty chat, and replies keep streaming while other views are open. `/api/history` accepts `limit`. The remaining old stylesheets now take every colour from the design tokens: no warm tints, gradients or shadows are left anywhere.

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

