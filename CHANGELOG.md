# Changelog

## 2026-09-19
- Replace the two-phase chat flow with one tools-or-answer loop.
- Stream each model round's ordinary assistant text while tools run.
- Fix tool-call markup (`<｜DSML｜…>`) leaking into answers
- Rank FAQ entries, concept pages, and lecture slides together by relevance instead of filling FAQ slots first.
- `topic="raw"` search returns individual `####` slides, several per lecture, each with its heading path and anchor.
- `read_wiki_page` accepts an `anchor` and returns only that heading and its descendants verbatim (slide, subsection, or section); tool descriptions and the system prompt steer the model toward one good search and the smallest useful read.
- Lecture slides and FAQ questions (`####`) render at 17px in the reader and chat, between body text and `###`; `#####`/`######` no longer fall back to browser defaults.
- Add tests that wiki→lecture, wiki→wiki, wiki→FAQ, FAQ→lecture/wiki links, chat citations, and search `citation_target`s all resolve correctly.

## 2026-09-18
- Improve logging
- Shrink image attachments to what DeepSeek scales them to anyway (about 1300×1300 pixels, JPEG q80): the browser does it before upload, the server repeats it as a fallback, and the stored file is the version the model saw. The 20 MB limit applies to the file as picked and is now also checked in the composer; images over 50 megapixels and corrupt image files are refused.
- Remove the 4-minute hard cap on chat generation: long answers no longer die mid-stream (a dead stream still fails via the API client timeout, and the stop button always works).
- Raise the student daily token quota to 5,000,000; when exhausted, show the student the quota message instead of a generic rate-limit error.
- Forbid topic names and directories as citation targets, and have read_wiki_page return a citation_target like search results.
- Inject the course progress file (llm_wiki/progress.md) into the chat context.
- Teach more proactively in chat.
- Drag and drop files anywhere in the chat to attach them: the composer becomes the drop target, the history recedes, unsupported types and files over the limit are reported inline, and image attachments show a thumbnail in the composer chip.

## 2026-09-17
- Name each new chat automatically. Fit chat names to the sidebar.
- Remove personal identifiers (school name, server username, domain, and course repo URL) from the README, package metadata, login footer, config comment, and deploy docs/script; the course repo and health-check URL are now `<course-repo-url>` / `<your-domain>` placeholders.
- Add copy, regenerate, and edit actions below each chat question. Resending a question (regenerated or edited) replaces it, discards every turn after it, and re-uploads its attachments; its discarded attachment files are deleted.
- Shorten chat suggestions, the disclaimer, and the history search placeholder to fit one line on mobile.
- Add a server-persisted thinking-level selector per conversation (Standard/Low/High/Max; existing and new chats default to Standard), with matching 36px attachment/thinking touch targets and controls/menu clicks isolated from draft focusing.
- Opening Wiki or Lectures lands on the Wiki index or first lecture, while mobile Back remains on the file list.
- Scope blocking swipe handling to active edge gestures and share modal-drawer keyboard focus behavior.
- Keep new-chat greetings and suggestions visible on focus without explicit keyboard lifting; preserve typing focus through the thinking menu and sample viewport geometry during keyboard transitions.

## 2026-09-16 — Mobile and keyboard navigation
- Add guarded mobile swipes and consistent slide/fade transitions with eagerly rendered entries for global navigation and in-place Wiki/Lecture file drawers, preserving readers and avoiding unresolved-link list flashes.
- Size the mobile composer layout directly from the visual viewport; touch Enter inserts a newline while desktop Enter sends.
- Keep reading panes keyboard-ready with focus cues on interactive controls only, shared short Page Up/Down animations (including while composing), an animated chat bottom jump, and reduced-motion support.

## 2026-09-16 — Chat continuity
- Keep accepted replies running independently of browser connections and synchronize conversations across tabs/devices.
- Load history independently of live streams; release hidden-tab connections and quietly retry brief interruptions.
- Position new questions above their answer area and preserve reading positions without following streamed output.
- Close live event streams and finalize replies before server connection draining.
- Explicitly separate evidence preparation from tool-disabled answer generation.
- Require a Wiki search per question and prohibit system-prompt disclosure in chat instructions.

## 2026-09-16
- Delete a chat's uploaded attachment files together with its history.
- Coordinate deletion with active replies and discard uploads when chat creation fails.
- Clarify Web chat scope, evidence use, teaching strategy, and citation behavior.
- Remove the standalone Query API, interactive CLI modes, and their obsolete prompts and configuration; retain Web startup and Wiki index operations.
- Remove unused code, dependencies, assets, tooling files, and completed implementation notes.
- Base history compaction on retained conversation content without rescanning the course Wiki.

## 2026-09-14
- Quote selected Wiki or lecture text into a new chat with its source name.
- Render chat display math when formulas share `$$` delimiter lines, while leaving document parsing unchanged.
- Stream final chat answers live after a silent, model-directed evidence preparation phase.
- Improve prompts
- Build shared SQLite FTS5 section search during deployment, with weighted BM25, complete Markdown excerpts, and process-safe rebuilds.
- Display completed chat answers with separate tool-progress updates.
- Preserve Wiki and lecture heading destinations through navigation and chat citations.
- Use one open-book icon for the sidebar, login page, and browser tab.
- Keep menu labels within narrow screens, pluralize English counts, and place the new-chat disclaimer at the bottom.

## 2026-09-13 — UI fixes

- Translate the web UI to English: all interface text, error messages, and date/number formatting (en-US); course content, student questions, names, and AI replies unchanged.
- Add native route links and typed URL state, accessible landmarks, focus, MathML, announcements, draft protection, safe errors, locale formatting, and long-list rendering safeguards.
- Preserve natural document images while using stable uncropped attachment previews; refine touch, motion and reduced-motion behavior.
- Keep filtered reference links, historical scrolling, pending edits and background summary navigation consistent.
- Correct filtered document navigation, lazy citation titles, retry state, focus restoration, draft unload handling, and streamed error announcements.
- Allow native inline-math line breaks while retaining scrolling for wide display equations.
- Correct equation-number sizing in scrollable display math.
- Add persistent system/light/dark appearance, restrained surface depth and popover motion, and higher-contrast status/citation colors.
- Refine mobile safe areas and modal navigation; load secondary views on demand and document final manual QA.
- Scope chat focus indicators to interactive controls while retaining native keyboard scrolling.
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

