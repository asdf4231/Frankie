# Frankie Frontend Overhaul Plan

Target: a flat, minimal, premium chat UI in the spirit of ChatGPT / Claude / DeepSeek, that is fast on
low-end student laptops and consistent across every view.

This document is written for a developer who has not seen the codebase before. It has four parts:

1. **Audit** — what is wrong today, with file and line references, so you understand *why* each change exists.
2. **Design system** — the single source of truth for colors, type, spacing, radius, motion, icons and components.
3. **Architecture** — the small structural changes that fix whole classes of bugs.
4. **Phased work plan** — ordered tasks with steps and acceptance criteria. One phase = one PR.

Read parts 1–3 fully before starting Phase 0. Everything in part 4 refers back to them.

Repo conventions that apply (from `AGENTS.md`):

- When you remove something, remove it completely. No commented-out blocks, no "deprecated" stubs, no
  "this used to be…" notes in code, UI or docs.
- Append a short dated entry to `CHANGELOG.md` when a phase merges. Never edit older entries.
- Do not add tests unless asked. Use the manual QA checklists in this document instead.
- Build with `pnpm --dir frontend build` from the repo root; the FastAPI server serves `frontend/dist`.
  For development run `uv run frankie web` (port 7860) and `pnpm --dir frontend dev` (port 5173, proxies `/api`).

---

## Part 1 — Audit of the current frontend

### 1.1 Files

| File | Lines | Role |
|---|---|---|
| `src/index.css` | 3398 | All styles except Learning. Five stacked "theme layers" (see 1.3). |
| `src/views/Chat.tsx` | 498 | Chat view: state, SSE wiring, session popover, composer, message list, all in one component. |
| `src/views/FileLibrary.tsx` | 358 | 课件 / Wiki lists + Markdown reader. |
| `src/views/Learning.tsx` + `Learning.css` | 310 + 201 | Admin dashboard. Has its own colour palette. |
| `src/views/Settings.tsx`, `Status.tsx` | 241, 280 | Admin/config views. |
| `src/components/MessageContent.tsx` | 198 | Markdown + KaTeX + `[[wiki]]` citation rendering. |
| `src/hooks/useSSE.ts` | 173 | Chat streaming client. Solid; keep, add batching. |
| `src/api/client.ts` | 177 | Typed API wrappers. Keep. |
| `src/App.tsx` | 235 | Auth gate, sidebar, view switching, login screen. |
| `src/main.tsx` | 40 | Bootstraps React and a global "spotlight" pointermove effect. |

### 1.2 Performance root causes (issue 1: "CPU spikes while typing / holding Backspace")

There is no single culprit. Six things compound, and holding a key triggers all of them ~30 times per second.

| # | Cause | Where | Why it hurts |
|---|---|---|---|
| P1 | The composer's `input` state lives in `Chat`, so **every keystroke re-renders the whole Chat tree**, including every message. | `Chat.tsx:78`, `:475` | Each message runs `ReactMarkdown` again. `react-markdown` parses Markdown synchronously in render and `rehype-katex` re-renders every formula. `MessageContent` is not memoised, and the `components` map (`MessageContent.tsx:77-127`) and `onOpenRef` (`Chat.tsx:427`) are new objects each render, so `React.memo` alone would not help. A 30-message thread with formulas = 30 Markdown parses + all KaTeX per keystroke. |
| P2 | **Full-screen noise overlay with `mix-blend-mode: multiply`** on `body::after`, `position: fixed`, `z-index: 2147483000`. | `index.css:2337-2347`, repeated `:2711-2718` | Any repaint anywhere (caret blink, text change, growing textarea) forces the compositor to re-blend the entire viewport. This is the single most expensive rule in the file. |
| P3 | **Infinite box-shadow animations**: `send-breathe` on the send button whenever it is enabled (i.e. whenever there is text), `assistant-glow` + a conic-gradient `ring-spin` mask on *every* assistant avatar, `logo-breathe` on the empty-state logo. | `index.css:2785-2791`, `:2531`, `:2953-2970`, `:2909-2914` | `box-shadow` animations invalidate paint every frame. 20 assistant messages = 40 permanent animations, running even when the tab is idle. Typing enables the send button, which starts `send-breathe`, which repaints under the blend overlay (P2) at 60 fps. |
| P4 | **Spotlight pointer tracking**: a document-level `pointermove` handler calls `closest()` and `getBoundingClientRect()` (forced layout) and writes two CSS variables that repaint a radial-gradient pseudo-element. | `main.tsx:8-31`, `index.css:3137-3159` | Layout thrash on every mouse move over cards, input row, chips, login card. |
| P5 | **Textarea auto-resize in an effect**: sets `height:auto`, reads `scrollHeight` (forced reflow), sets height. Runs after every render caused by P1. | `Chat.tsx:134-139` | Cheap on its own, expensive as the tail of P1. |
| P6 | **Stacked backgrounds**: three `radial-gradient` layers on `.main-content`, `.login-shell`, `.sidebar`; `filter: blur()` pseudo-elements; view slide-in animation on every navigation. | `index.css:2350-2356`, `:2722-2729`, `:2484`, `:2900`, `:3179-3190` | Large gradient surfaces repaint when anything above them changes; blur filters are GPU-expensive; the 0.52 s slide delays interaction on every nav click. |

Secondary performance problems:

- **Streaming re-parse per chunk.** `onChunk` (`Chat.tsx:151`) calls `setMessages` for every SSE chunk. DeepSeek sends
  many small tokens, so the streaming message is re-parsed (Markdown + KaTeX) dozens of times per second, and because of
  P1 so is every other message.
- **Wiki search filters full text per keystroke.** `FileLibrary.tsx:152-156` lower-cases `search_text` (the whole page
  body) of every wiki file three times on every render. Not memoised, not deferred.
- **Triple fetch on file open.** `restoreFromUrl` depends on `[wikiFiles, sources]` (`FileLibrary.tsx:125-146`) so it
  runs on mount, again when sources arrive, again when wiki arrives: the same file is fetched up to three times.
- **Google Fonts in `index.html`.** `fonts.googleapis.com` is render-blocking and unreliable from mainland China. Inter
  does not cover CJK, so nearly all visible text falls back to the system font anyway.
- **Every view remounts on navigation** (`App.tsx:212-218`), so 课件/Wiki lists are refetched on every visit and the
  chat re-requests history.
- **Bundle**: one 674 KB JS chunk (React + react-markdown + KaTeX). Acceptable for now; code-splitting KaTeX is optional
  (Phase 6).

### 1.3 CSS state (issue 3: inconsistent look)

`index.css` is five complete themes appended one after another, each redefining `:root` and overriding the same
selectors: original light (line 5), "前端美化" (~1486), "Codex 质感升级" (~2005), "莫兰迪色系" (~2283), "Codex 暗色·琥珀光效"
(~2660), then "视图切换特效", "侧边栏美化", "界面平滑", "淡化边界" patches (3170–3398). The effective style of any
element is "whatever was last", which is why nothing matches:

| Metric | Count |
|---|---|
| `:root` blocks | 5 |
| `box-shadow` declarations | 116 |
| `border-radius` declarations / distinct values | 111 / 23 |
| `font-size` distinct values | 17 (incl. 12.5px, 13.5px, 1.1em) |
| `radial-gradient` / `linear-gradient` | 20 / 19 |
| hard-coded hex colours | ~70 distinct |

`Learning.css` adds a sixth palette (`--lr-ink #263b48`, `--lr-accent #376b6b`) and English "kickers"
(`TEACHING INSIGHTS`, `SESSION RECORD`, `CLASS LEARNING REPORT` at `Learning.tsx:67,279,301`) in an otherwise
Chinese UI.

**Rule for this project going forward: never add another override layer. Replace, don't append.** The whole of
`index.css` is deleted in Phase 1 and rebuilt from the token sheet in Part 2.

### 1.4 UX defects (issue 2)

| # | Defect | Where | Severity |
|---|---|---|---|
| U1 | Textarea and attach button are `disabled` while the assistant is generating. | `Chat.tsx:466`, `:477` | High |
| U2 | **IME bug.** `Enter` sends even while a Chinese IME composition is open, because `handleKeyDown` never checks `isComposing`. Pressing Enter to confirm pinyin candidates sends a half-typed message. | `Chat.tsx:270-275` | High |
| U3 | Opening a citation lands on 文件库 with the **课件 tab active** even when the file is a Wiki page. `tab` is hard-coded to `'sources'` on mount and `restoreFromUrl` never switches it or scrolls the item into view. | `FileLibrary.tsx:50`, `:125-146` | High |
| U4 | **Navigating away cancels generation.** `Chat` unmounts on any nav click; `useSSE`'s unmount cleanup aborts the fetch (`useSSE.ts:170`), the server sees the disconnect and marks the turn cancelled. Clicking a `[1]` citation mid-answer kills the answer. | `App.tsx:212-218` | High |
| U5 | Chat history is a floating popover behind a `☰` button instead of a persistent list in the sidebar. | `Chat.tsx:352-369` | Medium |
| U6 | Rename/delete use `window.prompt` / `window.confirm`. | `Chat.tsx:332`, `:340` | Medium |
| U7 | Navigation icons are emoji (`💬 📁 📋 📊 ⚙️ 📎 ☰ ✎ ✕ 📄 🧠 👤 ⚠️`), rendered differently on every OS. | `App.tsx:11-17`, throughout | Medium |
| U8 | Cannot switch sessions while generating (`if (loading) return`), but *can* start a new session, which silently stops generation. Inconsistent. | `Chat.tsx:317`, `:301-313` | Medium |
| U9 | Session is not in the URL; refresh always jumps to the most recent session; back/forward cannot move between sessions. | `Chat.tsx:94-114` | Medium |
| U10 | Global `:focus-visible { outline:none; box-shadow: var(--ring) }` breaks focus visibility on elements with their own shadow. | `index.css:1503`, repeated | Low |
| U11 | Duplicate logout (sidebar + Settings header, the latter reloads the page). Settings fetches `/api/settings` for students too (403). | `Settings.tsx:73`, `:103-110` | Low |
| U12 | No "scroll to bottom" affordance when the user has scrolled up during streaming. | `Chat.tsx:116-131` | Low |
| U13 | `list_sessions` defaults to 20 rows, so a sidebar history list would silently truncate. | `src/frankie/memory.py:272` | Low (backend, 5 lines) |
| U14 | Template leftovers: `public/icons.svg` (Bluesky/Discord icons), `src/assets/react.svg`, `vite.svg`, `package-lock.json` beside `pnpm-lock.yaml`, boilerplate `frontend/README.md`. | | Low |

---

## Part 2 — Design system

Everything below becomes `src/styles/tokens.css`. Components use tokens only. A hard-coded colour, radius, shadow or
font-size in a component stylesheet is a review blocker.

### 2.1 Principles

1. **Flat.** Surfaces are separated by background tone or a 1 px border, never by shadow. Shadows exist only on
   floating layers (menus, popovers, drawers).
2. **Monochrome UI, one accent.** Buttons, text and controls are shades of the text colour. The accent is reserved for
   links, citations and the active state of segmented controls. Focus indicators use neutral `--focus`.
3. **Nothing glows, breathes, slides or blurs.** No gradients, no `filter`, no `backdrop-filter`, no
   `mix-blend-mode`, no infinite animations, no hover transforms.
4. **One column.** Chat content and documents live in a centred 768 px column with generous line height.
5. **Quiet chrome.** The sidebar and headers use smaller, muted type so the conversation is the loudest thing on screen.

### 2.2 Colour tokens

Light is the default. Dark follows `prefers-color-scheme` and can be forced via `data-theme` on `<html>`
(Phase 6 adds the toggle; define both palettes from day one so nothing has to be revisited).

```css
:root {
  color-scheme: light;
  --bg:            #ffffff;   /* main surface */
  --bg-sidebar:    #f9f9f9;   /* sidebar, library list pane */
  --bg-muted:      #f4f4f4;   /* user bubble, composer, code blocks, segmented-control track */
  --bg-hover:      rgba(0, 0, 0, 0.05);
  --bg-active:     rgba(0, 0, 0, 0.08);
  --border:        rgba(0, 0, 0, 0.10);
  --border-strong: rgba(0, 0, 0, 0.20);
  --text:          #0d0d0d;
  --text-2:        #5d5d5d;   /* secondary labels, timestamps */
  --text-3:        #8f8f8f;   /* placeholders, captions, disabled */
  --focus:         var(--text-2); /* neutral focus indicator in either theme */
  --accent:        #1d5fd6;   /* links, citations, active segment */
  --accent-bg:     rgba(29, 95, 214, 0.10);
  --danger:        #d92d20;
  --danger-bg:     rgba(217, 45, 32, 0.08);
  --success:       #16a34a;
  --warning:       #b45309;
  --btn-primary-bg: #0d0d0d;
  --btn-primary-fg: #ffffff;
  --scrim:         rgba(0, 0, 0, 0.40);
  --shadow-popover: 0 4px 16px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

:root[data-theme="dark"] { /* and inside @media (prefers-color-scheme: dark) for :root:not([data-theme="light"]) */
  color-scheme: dark;
  --bg:            #212121;
  --bg-sidebar:    #171717;
  --bg-muted:      #2f2f2f;
  --bg-hover:      rgba(255, 255, 255, 0.06);
  --bg-active:     rgba(255, 255, 255, 0.10);
  --border:        rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.22);
  --text:          #ececec;
  --text-2:        #b4b4b4;
  --text-3:        #8e8e8e;
  --accent:        #7aa7ff;
  --accent-bg:     rgba(122, 167, 255, 0.14);
  --danger:        #f97066;
  --danger-bg:     rgba(249, 112, 102, 0.12);
  --success:       #4ade80;
  --warning:       #fbbf24;
  --btn-primary-bg: #ececec;
  --btn-primary-fg: #0d0d0d;
  --scrim:         rgba(0, 0, 0, 0.60);
  --shadow-popover: 0 4px 16px rgba(0, 0, 0, 0.50), 0 0 0 1px rgba(255, 255, 255, 0.06);
}
```

Status badges (Status view, Learning turn status) use `--success` / `--warning` / `--danger` text on a 10 % alpha
background of the same colour. No other colours exist.

### 2.3 Typography

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
               "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", "Noto Sans Mono CJK SC", monospace;
}
```

Remove the Google Fonts `<link>` tags from `index.html`. Do not self-host Inter; the CJK fallback would dominate anyway.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--fs-xs` | 12 / 16 | 400–500 | captions, date group labels, badges |
| `--fs-sm` | 13 / 18 | 400 | sidebar meta, breadcrumbs, timestamps, hints |
| `--fs-md` | 14 / 20 | 400–500 | default UI: sidebar items, buttons, inputs, menus, table cells |
| `--fs-lg` | 15 / 22 | 400–600 | composer text, list titles, brand name |
| `--fs-body` | 16 / 28 | 400 | message body, document body (`line-height: 1.75`) |
| `--fs-h3` | 18 / 26 | 600 | document H3, panel titles |
| `--fs-h2` | 20 / 28 | 600 | view titles, document H2 |
| `--fs-h1` | 24 / 32 | 600 | document H1 |
| `--fs-hero` | 28 / 36 | 500 | empty-state greeting |

Weights: 400, 500, 600 only. Headings inside Markdown: H1 24, H2 20, H3 18, H4 16; margins `1.5em 0 0.5em`.
Never set `letter-spacing` on Chinese text.

### 2.4 Spacing, radius, borders, shadows

- Spacing scale: `4 8 12 16 24 32 48` px. Nothing else.
- Radius tokens: `--r-sm: 6px` (chips, inline code, small icon buttons) · `--r-md: 8px` (list items, inputs, menu
  items, buttons) · `--r-lg: 12px` (cards, panels, images, code blocks) · `--r-bubble: 18px` (user message) ·
  `--r-composer: 24px` · `--r-full: 999px` (avatars, send button, pills).
- Borders: always `1px solid var(--border)`. `--border-strong` only for focused inputs and the composer's
  focus-within state.
- Shadows: `--shadow-popover` only, on `.menu`, `.popover`, `.drawer`. Nowhere else.

### 2.5 Motion

- Transitions: `background-color, color, border-color, opacity` at `120ms ease`. Nothing else transitions.
- Allowed animations: (a) thinking indicator — three 6 px dots pulsing `opacity` 0.3→1, 1.2 s, staggered;
  (b) spinner — `transform: rotate` only; (c) drawer / sidebar open-close — `transform: translateX`, 200 ms;
  (d) menu open — `opacity` 100 ms. All are compositor-only properties.
- Forbidden: animating `box-shadow`, `filter`, `background-position`, `width/height`; view transitions; message
  entry animations; hover `translateY`/`scale`.
- Keep the existing `prefers-reduced-motion` rule (disable a–d).

### 2.6 Icons

One component, `src/components/Icon.tsx`, inline SVG, `viewBox="0 0 24 24"`, `stroke="currentColor"`,
`stroke-width="1.75"`, `fill="none"`, round caps/joins (Lucide style; copy paths from lucide.dev, MIT). Default size
20 px; 16 px inside chips and badges. Required names:

`plus, message-square, book-open, file-text, bar-chart, activity, settings, user, log-out, panel-left, search,
paperclip, arrow-up, square, pencil, trash, check, x, chevron-down, chevron-right, chevron-left, more-horizontal,
copy, external-link, alert-circle, loader, arrow-down, sun, moon, image`.

The Learning view's private `Icon` (`Learning.tsx:15-27`) is replaced by this component. No emoji anywhere in the UI.

### 2.7 Component sheet

All class names are BEM-lite: `.block`, `.block-part`, state modifiers as `.is-active`, `.is-open`, or ARIA
attributes (`aria-pressed`, `aria-current`) styled directly. No inline `style=` except for values that are truly dynamic
(e.g. textarea height).

**Buttons** (`.btn`): height 36 px, padding 0 12 px, radius `--r-md`, `--fs-md` 500, gap 8 px for icon + label.
Variants: `.btn-primary` (`--btn-primary-bg/fg`, hover opacity .9), `.btn-ghost` (transparent, hover `--bg-hover`),
`.btn-danger` (text `--danger`, hover `--danger-bg`). `.btn-icon`: 32×32, radius `--r-md`, ghost. `.btn-icon-round`:
32×32, `--r-full`. Disabled: opacity .4, `cursor: default`, no hover.

**Inputs** (`.input`): height 36 px (40 px on login), padding 0 12 px, bg `--bg`, border 1 px `--border`, radius
`--r-md`, `--fs-md`. Focus: `border-color: var(--border-strong)`. Search variant: bg `--bg-muted`, no border, leading
`search` icon, clear `x` button when non-empty.

**Focus indicators** (global): `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }`, with
`--focus: var(--text-2)`. List items use `outline-offset: -2px`. Composite inputs (composer and search fields) use
`.focus-field`: when the inner input or textarea is focus-visible, a single inset outline follows the rounded outer
surface. Suppress the inner outline only when that outer indicator is supported and visible. Buttons inside the
surface retain their own focus indicators.

**Segmented control** (`.segmented`): track bg `--bg-muted`, radius `--r-md`, padding 2 px; segments `--fs-md`, height
28 px, radius `--r-sm`; active segment bg `--bg`, colour `--text`, weight 500 (light) — in dark, active bg `--bg-active`.

**Menu / popover** (`.menu`): bg `--bg`, border 1 px `--border`, radius `--r-lg`, padding 4 px, `--shadow-popover`,
min-width 180 px; items 32 px tall, radius `--r-sm`, `--fs-md`, hover `--bg-hover`, danger item text `--danger`.
Closes on outside click, `Esc`, scroll, and item click. Implemented once as `components/Menu.tsx`: the panel is
rendered in a portal with `position: fixed`, placed from the trigger's rect (flips upward when there is no room), so
it is never clipped by a scrolling list; no library.

**List item** (sidebar sessions, library files, roster): height 36 px, padding 0 10 px, radius `--r-md`, `--fs-md`,
single-line ellipsis, hover `--bg-hover`, active `--bg-active` + weight 500. Trailing action button appears on hover /
focus-within only (desktop) and always on touch devices.

**Badge** (`.badge`): `--fs-xs` 500, padding 2 px 8 px, radius `--r-full`. Neutral: bg `--bg-muted` colour `--text-2`.
Status: colour + 10 % bg of `--success`/`--warning`/`--danger`.

**Card / panel** (`.panel`): bg `--bg`, border 1 px `--border`, radius `--r-lg`, padding 16–24 px. No hover state.

**Scrollbars**: `scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent;` plus the WebKit
equivalent (8 px, transparent track, thumb `--border-strong`, radius full). Chat and reader use `scrollbar-gutter: stable`.

---

## Part 3 — Architecture changes

Three small changes eliminate U3, U4, U9 and the remount refetches, and make the rest of the plan straightforward.

### 3.1 A tiny URL router (`src/lib/router.ts`)

All navigation state lives in the query string and every view reads it through one hook. No more
`window.dispatchEvent(new CustomEvent('frankie-open-wiki'))`, no per-view `popstate` listeners.

```
?view=chat[&session=<id>]
?view=wiki[&file=<abs_path>]
?view=lectures[&file=<abs_path>]
?view=learning | status | settings
```

```ts
import { useSyncExternalStore } from 'react'

export type View = 'chat' | 'wiki' | 'lectures' | 'learning' | 'status' | 'settings'
export interface Route { view: View; session?: string; file?: string }

const VIEWS: View[] = ['chat', 'wiki', 'lectures', 'learning', 'status', 'settings']
const listeners = new Set<() => void>()
let cachedSearch = ''
let cachedRoute: Route = { view: 'chat' }

function parse(): Route {
  const p = new URLSearchParams(window.location.search)
  const view = (VIEWS as string[]).includes(p.get('view') ?? '') ? (p.get('view') as View) : 'chat'
  return { view, session: p.get('session') ?? undefined, file: p.get('file') ?? undefined }
}
function snapshot(): Route {               // stable reference while the URL is unchanged
  if (window.location.search !== cachedSearch) { cachedSearch = window.location.search; cachedRoute = parse() }
  return cachedRoute
}
function emit() { listeners.forEach((l) => l()) }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
window.addEventListener('popstate', emit)

export function useRoute(): Route { return useSyncExternalStore(subscribe, snapshot) }
export function navigate(route: Route, opts: { replace?: boolean } = {}) {
  const p = new URLSearchParams()
  p.set('view', route.view)
  if (route.session) p.set('session', route.session)
  if (route.file) p.set('file', route.file)
  const url = `?${p.toString()}`
  if (url === window.location.search) return
  history[opts.replace ? 'replaceState' : 'pushState'](null, '', url)
  emit()
}
```

Citation clicks become: `resolveWiki(target).then(page => navigate({ view: page.rel_path.startsWith('raw/') ? 'lectures' : 'wiki', file: page.abs_path }))`.
`rel_path` is relative to the wiki root (`web.py`, `api_wiki_resolve`), and lectures live under `raw/`, so the prefix
test is reliable.

### 3.2 Conversation state outside React; `Chat` stays mounted

The open conversation (messages, streaming state, the SSE handle) lives in a module store, `lib/conversation.ts`,
read through `useConversation()` and driven by exported actions (`sendMessage`, `stopGeneration`, `newChat`,
`syncRoute`, `openReference`). The sidebar's session list (`lib/sessions.ts`) is another small store. Keeping this
state outside components means a reply keeps streaming no matter which view is open, URL changes are handled in one
place (`syncRoute`), and no component needs a state-setting effect.

`App` still renders `<Chat />` once and hides it with `<div class="view-host" hidden>` when another view is active,
so the scroll position and the composer draft survive as well. `shell.css` sets `.view-host[hidden] { display: none }`
explicitly because the host is a flex container. Other views mount on demand; their data comes from the cache (3.3).

### 3.3 Request cache for static lists (`src/lib/cache.ts`)

Wiki and lecture lists change only when the teacher pushes to the course repo. Cache the promise in module scope with a
5-minute stale time and expose `getWikiCached()`, `getSourcesCached()`, `invalidateLibrary()`. Fifteen lines; no library.

### 3.4 File layout after the overhaul

```
src/
  main.tsx                      bootstrap only (no spotlight)
  App.tsx                       auth gate + <Shell>
  lib/router.ts  lib/cache.ts  lib/dates.ts (group sessions by day)  lib/frontmatter.ts
  lib/sse.ts (chat stream client, chunk batching)  lib/sessions.ts  lib/conversation.ts
  api/client.ts                 unchanged API; add limit param to getHistory
  hooks/useMediaQuery.ts  hooks/useLocalStorage.ts  hooks/useTheme.ts
  components/Icon.tsx  Menu.tsx  Sidebar.tsx  SessionList.tsx  UserMenu.tsx  MessageContent.tsx  Citation.tsx  Markdown.css
  views/chat/Chat.tsx  Composer.tsx  MessageList.tsx  MessageItem.tsx  EmptyState.tsx  chat.css
  views/library/Library.tsx  FileList.tsx  Reader.tsx  library.css
  views/learning/Learning.tsx  learning.css
  views/Settings.tsx  settings.css   views/Status.tsx  status.css   views/Login.tsx  login.css
  styles/tokens.css  base.css  components.css  shell.css   (legacy.css until Phase 5)
```

Import each view's CSS from the view file (as `Learning.tsx` already does). Target total CSS ≤ 1600 lines.

---

## Part 4 — Phased work plan

Estimates assume one developer. Ship each phase as its own PR against `main`; Phase 0 first as a hotfix.

| Phase | Scope | Est. |
|---|---|---|
| 0 | Performance hotfixes + two high-severity UX bugs, no visual redesign | 1–2 days |
| 1 | Foundation: tokens, base CSS, icons, router, cache; delete old CSS | 2 days |
| 2 | App shell: sidebar with chat history, user menu, header, mobile drawer | 3 days |
| 3 | Chat view: composer, messages, citations, empty state, streaming polish | 4 days |
| 4 | Library: Wiki / 课件 lists and reader | 2–3 days |
| 5 | Learning, Status, Settings, Login restyle | 2 days |
| 6 | Dark mode toggle, mobile pass, cleanup, bundle split | 2–3 days |

### Phase 0 — Stop the bleeding (ship independently)

Goal: CPU idle while typing; no behaviour changes visible except the two bug fixes.

**0.1 Remove paint-heavy CSS.** Delete these rules from `index.css` (do not comment out):
`body::after` noise overlay (both copies, ~2337 and ~2711); `@keyframes send-breathe`, `assistant-glow` (both),
`ring-spin`, `logo-breathe`, `msg-in`, `view-slide-in` and every `animation:` that references them; the
`.message.assistant .message-avatar::before` conic ring; the spotlight block (3137–3159) and the `::after` spotlight
pseudo-elements; the `filter: blur()` on `.empty-hero::before` (delete the pseudo-element); `mix-blend-mode`
everywhere. Delete `initSpotlight` and its call from `main.tsx`.

**0.2 Move composer state out of `Chat`.** Create `views/chat/Composer.tsx` holding `input`, `attachments`, the
textarea ref and the auto-resize. Props: `{ disabled: boolean /* only blocks send */, busy: boolean, onSend(text, files), onStop() }`.
`Chat` no longer re-renders on keystrokes. Auto-resize runs inside the `onChange` handler, not an effect.

**0.3 Memoise message rendering.**
- Wrap `MessageContent` in `React.memo`. Build the `components` map with `useMemo(() => ({...}), [onOpenRef, refs])`.
- In `Chat`, make `onOpenRef` a `useCallback` with no changing deps (read `setReferenceError` via the stable setter).
- Extract `MessageItem` (one message) and wrap in `React.memo`; pass only `message`, `agentStatus` (only to the
  streaming one) and `onOpenRef`.
- Pass `rehypeKatex` options `{ output: 'html' }` (halves KaTeX DOM) in both `MessageContent` and the library reader.

**0.4 Batch streamed chunks in `useSSE`.** Accumulate `chunk` text and flush at most once per animation frame; flush
synchronously before dispatching `agent_status`, `error` and `done` so ordering is preserved.

```ts
let pending = ''
let frame = 0
const flush = () => { frame = 0; if (pending && isActive()) { const t = pending; pending = ''; onChunk(t) } }
// in dispatchEvent:
case 'chunk': pending += String(data.text ?? ''); if (!frame) frame = requestAnimationFrame(flush); break
default:      if (frame) { cancelAnimationFrame(frame); flush() } // then handle the event as before
```

Also call `flush()` in the `finally` of the read loop and cancel the frame in `abort()`.

**0.5 Fix IME Enter (U2).**

```ts
const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return
  e.preventDefault()
  submit()
}
```

**0.6 Let the user type while generating (U1).** Remove `disabled={loading}` from the textarea and the file input.
While `busy`: the send button is replaced by the stop button; `Enter` does nothing (keep the draft); attachments can be
added. Tooltip on the stop button: 停止生成.

**0.7 Auto-scroll without `scrollIntoView`.** Replace the bottom sentinel with `container.scrollTop = container.scrollHeight`
inside a `requestAnimationFrame`, gated by the existing `shouldFollowRef`. Trigger it from the message list's layout
effect keyed on `messages.length` and on the streaming message's content length.

**0.8 Library filter cost.** Wrap `filteredSources`, `filteredWiki`, `wikiByTopic`, `sortedTopics` in `useMemo`; feed
them a `useDeferredValue(filter)`; pre-compute a `searchBlob` (lower-cased title + rel_path + search_text) once per file
when the list loads.

**Acceptance (Phase 0)**
- Chrome DevTools → Performance: record 5 s of holding Backspace in a conversation with ≥ 20 assistant messages
  containing formulas. Main-thread activity < 15 % (before: continuous). No long tasks > 50 ms.
- `document.getAnimations().length === 0` in the console while idle on the chat view.
- `grep -rcE 'mix-blend-mode|backdrop-filter|filter: *blur' src --include='*.css'` reports 0 everywhere, and the only
  `infinite` animations left are `blink` (streaming caret), `chat-bounce` (thinking dots) and `lr-spin` (loading
  spinner), which run only while generating or loading.
- Typing during generation works; Enter during IME composition does not send; Enter after composition sends.
- Streaming still renders every token in order; Stop still works; errors still show.

### Phase 1 — Foundation

**1.1 Tokens and base.** Create `styles/tokens.css` exactly from Part 2. Create `styles/base.css` (reset,
`html,body,#root { height:100% }`, body font, `button, input, textarea { font: inherit; color: inherit; }`, global
focus ring, scrollbar rules, `::selection`, `.visually-hidden`, `.spin`) and `styles/components.css` (`.btn*`,
`.btn-icon*`, `.input`, `.search`, `.segmented`, `.list-item`, `.group-label`, `.badge*`, `.panel`, `.menu*`). Import
all three from `main.tsx`.

**1.2 Retire `src/index.css` through a cascade layer.** Rename it to `styles/legacy.css`, wrap its content in
`@layer legacy { … }`, and declare `@layer base, legacy;` at the top of `base.css`. Because unlayered rules beat every
layer and `legacy` beats `base`, the new tokens, components and view stylesheets always win, while views that have not
been rebuilt keep their old rules and the app stays usable between phases. In this phase delete from legacy.css
everything that is now global (reset, `body`, `:focus-visible`, `::selection`, scrollbars, reduced-motion) and the
Markdown rules replaced by `Markdown.css`. Legacy variable names (`--bg-input`, `--text-primary`, …) are aliased to
the tokens in one `:root` block at the top of the layer, and every hard-coded colour, gradient and shadow in the old
rules is rewritten to a token or removed, so the views waiting for their phase already share the new palette. Each
later phase deletes the rules of the view it rebuilds; Phase 5 deletes the file. Never add rules to legacy.css and
never copy rules out of it without checking them against Part 2.

**1.3 Icons.** Create `components/Icon.tsx` with the names in 2.6. Signature:
`<Icon name="plus" size={20} className? />`, `aria-hidden` by default; when an icon is the only content of a button, the
button must have `aria-label`.

**1.4 Router and cache.** Add `lib/router.ts` (3.1) and `lib/cache.ts` (3.3). Replace `readView`, `navigate`, the
`popstate` and `frankie-open-wiki` listeners in `App.tsx` with `useRoute()` / `navigate()`. Replace the
`dispatchEvent(...)` calls in `Chat.tsx` and `Learning.tsx`. Replace `FileLibrary`'s own `popstate` handling with
`useRoute()`.

**1.5 `index.html`.** Remove the Google Fonts `<link>` tags. Add `<meta name="color-scheme" content="light dark">` and
`<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">` / dark `#212121`.

**1.6 Markdown styles.** Create `components/Markdown.css` with one `.md` block used by both chat and reader: body 16/1.75;
paragraph margin `0 0 1em`; headings per 2.3; lists `padding-left: 1.5em`; `code` inline: `--font-mono` 0.9em, bg
`--bg-muted`, padding `2px 5px`, radius `--r-sm`, no border; `pre`: bg `--bg-muted`, radius `--r-lg`, padding 12 16,
`overflow-x:auto`; `blockquote`: `border-left: 2px solid var(--border-strong)`, padding-left 12, colour `--text-2`, no
background, no italic; tables: `border-collapse`, 1 px `--border` cells, header weight 500, wrap in `.md-table` with
`overflow-x:auto`; `hr`: 1 px `--border`; links: `--accent`, underline on hover; `.katex-display` margin `1em 0`,
`overflow-x:auto`; images max-width 100 %, radius `--r-lg`.

**Acceptance (Phase 1)**
- `src/index.css` is gone; `styles/legacy.css` holds only per-view rules for views not yet rebuilt (no `body`,
  `:focus-visible`, scrollbar or Markdown rules), contains no hex or rgba colour, and every stylesheet takes its
  values from `tokens.css`.
- Back/forward moves between `?view=` states with no page reload and no console errors.
- Citation click from chat lands on the correct view (wiki or lectures) via `navigate()`.

### Phase 2 — App shell

Desktop layout (≥ 768 px):

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ ◧ 厦大课程助教 │ [◧][+]  (only when sidebar collapsed)      会话标题       │  header 48px
│ + 新对话      │                                                          │
│ ▢ Wiki       │                                                          │
│ ▢ 课件        │                 <active view>                            │
│ ▢ 学习情况 ᵃ  │                                                          │
│ ▢ 状态 ᵃ      │                                                          │
│              │                                                          │
│ 今天          │                                                          │
│  Bellman 方程 ⋯│                                                          │
│  KT 条件      │                                                          │
│ 昨天          │                                                          │
│  ...          │                                                          │
│              │                                                          │
│ (J) 张钧南  ⋯ │                                                          │  footer 56px
└──────────────┴──────────────────────────────────────────────────────────┘
   260px           ᵃ admin only
```

**2.1 `components/Sidebar.tsx`.** Width 260 px, bg `--bg-sidebar`, no border, `display:flex; flex-direction:column`.
- Brand row (48 px): 24 px logo (`/xmuc-logo.svg`), name 厦大课程助教 `--fs-lg` 600, trailing `.btn-icon` `panel-left`
  (aria-label 收起侧边栏).
- Primary items: `新对话` (square-pen, always first), `Wiki` (book-open), `课件` (file-text), admin: `学习情况`
  (bar-chart), `状态` (activity). List-item style from 2.7; active uses `aria-current="page"`. `新对话` navigates to
  `{ view:'chat' }` with no session and focuses the composer.
- Session history (`components/SessionList.tsx`): scrollable region `flex:1; min-height:0; overflow-y:auto`. Groups by
  `updated_at` (`lib/dates.ts`): 今天 / 昨天 / 最近 7 天 / 最近 30 天 / `YYYY年M月`. Group label `--fs-xs` 500 `--text-3`,
  padding `16px 12px 4px`. Item = list-item with title (`topic || '新会话'`), active when `route.session` matches.
  Trailing `more-horizontal` `.btn-icon` (28 px) visible on hover/focus-within; opens `Menu` with 重命名 / 删除.
  - 重命名: title becomes an `<input>` prefilled; Enter or blur commits via `renameHistory`; Esc cancels; empty → keep.
  - 删除: menu item label changes to `确认删除` for 3 s; second click calls `deleteHistory`. If the deleted session is
    open, navigate to a new chat.
  - Optional filter: a search input at the top of the list appears when there are > 15 sessions.
- Footer (56 px): button spanning the row → 28 px round avatar with the first character of `display_name` on `--bg-muted`,
  name `--fs-md` 500, `管理员` neutral badge for admins, trailing `more-horizontal`. Opens `UserMenu`: 设置, 外观
  (Phase 6), 退出登录 (danger).
- Collapsed state: sidebar `transform: translateX(-100%)` and `width:0` after the transition (use `visibility:hidden`
  when collapsed so it is untabbable). Persist in `localStorage['frankie.sidebar']`. When collapsed, the main header
  shows `panel-left` and `plus` icon buttons on the left.

**2.2 Header.** 48 px, transparent, `display:flex; align-items:center; gap:8px; padding:0 12px`. Contents: collapsed
controls (see above), then view title (`--fs-md` 500 `--text-2`): for chat the session topic (truncate), for others
the view name. No border. On mobile it also holds the menu button.

**2.3 Mobile (< 768 px).** Remove the bottom tab bar. The sidebar becomes a drawer: fixed, 85 vw max 320 px, over a
`--scrim` backdrop, `translateX` 200 ms, closes on scrim tap, `Esc`, or any navigation. Header: `menu` button
(`panel-left`), title, `plus` button. Add `hooks/useMediaQuery.ts`.

**2.4 Backend touch.** `GET /api/history` accepts `limit` (default 20, max 200). `getHistory(limit = 100)` in the
client. Session summaries include `updated_at` already.

**2.5 Session state in URL (U9).** `Chat` reads `route.session`. On change: abort any stream (this is the Stop
semantics; same as before), load the session, render. `onSession` (first reply of a new chat) calls
`navigate({ view:'chat', session:id }, { replace:true })`. Opening `?view=chat` with no session shows the empty state;
**the app no longer auto-opens the latest session on load** (matches ChatGPT/DeepSeek; history is one click away).
Confirmed with the owner on 2026-09-12.

**2.6 Keep `Chat` mounted** (3.2). Remove `if (loading) return` from session switching; switching or starting a new
chat while generating stops generation (consistent with the existing new-session behaviour) and the sidebar item shows
the truncated result after `getHistory()` refreshes.

**Acceptance (Phase 2)**
- History list shows all sessions grouped by date; rename/delete work without native dialogs.
- Refresh keeps the current session; back/forward switch sessions.
- Clicking Wiki while an answer is streaming, then returning to chat, shows the answer still streaming.
- Collapse state survives reload. Drawer works with touch and keyboard on a 375 px viewport.

### Phase 3 — Chat view

```
                    ┌──────────────── 768px column ────────────────┐
                    │                                              │
                    │                          ┌────────────────┐  │  user: --bg-muted, r-bubble,
                    │                          │ 什么是 Bellman  │  │  max-width 70%, right-aligned
                    │                          │ 方程？          │  │
                    │                          └────────────────┘  │
                    │                                              │
                    │  Bellman 方程是动态规划的核心… [1]           │  assistant: plain text, full width
                    │  $$ V(x)=\max_u\{ r(x,u)+\beta V(f(x,u)) \}$$│
                    │  …                                           │
                    │  ⧉                                           │  copy action
                    │                                              │
                    │  ● ● ●  正在检索：Kuhn–Tucker                 │  thinking indicator + agent status
                    │                                              │
                    ├──────────────────────────────────────────────┤
                    │ ┌──────────────────────────────────────────┐ │
                    │ │ 给 Frankie 发送消息…                      │ │  composer: --bg-muted, r-composer
                    │ │                                          │ │
                    │ │ 📎                                    (↑) │ │  row 2: attach left, send/stop right
                    │ └──────────────────────────────────────────┘ │
                    │   内容由 AI 生成，请结合课件核对                │  --fs-xs --text-3, centred
                    └──────────────────────────────────────────────┘
```

**3.1 Layout.** `.chat` is a column: `.chat-scroll` (`flex:1; overflow-y:auto; scrollbar-gutter:stable`) containing
`.chat-column` (`max-width:768px; margin:0 auto; padding: 24px 16px 32px`), then `.chat-footer` (composer + disclaimer,
same column width, `padding: 0 16px 12px`). No header border, no footer border, no gradient fade.

**3.2 Empty state (`EmptyState.tsx`).** When there are no messages the column centres vertically:
greeting `你好，{display_name}` `--fs-hero` 500 (needs `me` passed down from `App`), then the composer **in the centre
of the page** directly below the greeting, then three suggestion chips (`.btn-ghost` with 1 px border, radius `--r-full`,
`--fs-md`): 什么是 Bellman 方程？ / Kuhn–Tucker 条件的直观理解 / 动态规划与最优控制有什么关系？. After the first message the
composer docks to the bottom (`.chat` gets `.has-messages`; the composer is the same element, only its container
changes, so focus and draft survive). No logo, no hero glow, no title block.

**3.3 Composer (`Composer.tsx`).** Container: bg `--bg-muted`, radius `--r-composer`, `border: 1px solid transparent`,
focus-within `border-color: var(--border-strong)`, padding `12px 12px 8px 16px`. Row 1: `<textarea>` `--fs-body` 16 px,
`line-height 1.5`, `rows=1`, max height 200 px (auto-resize; use `field-sizing: content` under `@supports` and the JS
fallback otherwise), placeholder 给 Frankie 发送消息…, bg transparent, no border, with focus shown on the rounded
`.focus-field` container. Clicking the composer's blank surface focuses the textarea; attachment and action buttons
keep their own behavior.
Row 2: left `.btn-icon-round` paperclip (aria-label 添加附件; wraps the hidden file input; accept list unchanged;
max 5 files, keep the existing slice), right `.btn-icon-round` with `--btn-primary-bg/fg` and `arrow-up`
(disabled when there is no text and no attachments) or, when busy, the same circle with `square` (aria-label 停止生成).
Attachment chips render above row 1 inside the container: chip bg `--bg`, border 1 px `--border`, radius `--r-md`,
`--fs-sm`, leading `file-text`/`image` icon, name ellipsis (max 200 px), trailing `x` button.
Below the composer: `内容由 AI 生成，请结合课件核对` `--fs-xs` `--text-3` centred (replaces the Enter/Shift+Enter hint;
keep that hint as the textarea `title`). Drag-and-drop files onto the composer is optional.

**3.4 Messages (`MessageList.tsx`, `MessageItem.tsx`).** Gap between messages 24 px.
- User: `align-self:flex-end; max-width:70%; background:var(--bg-muted); border-radius:var(--r-bubble); padding:10px 16px; font-size:16px; line-height:1.7; white-space:pre-wrap; overflow-wrap:anywhere`.
  Attachments inside the bubble above the text: images as thumbnails (max 240×180, radius `--r-lg`, `object-fit:cover`,
  open in new tab), documents as chips.
- Assistant: no avatar, no bubble, `.md` typography full column width. While `streaming && !content`: thinking
  indicator (three dots) followed by `agentStatus` text `--fs-sm` `--text-2` (e.g. 正在检索：Bellman 方程). While
  streaming with content: `agentStatus` shows as the same row *below* the content, and the trailing caret is a 2 px ×
  1em inline block in `--text-3` that blinks via opacity (no `▋` glyph, no `::after` on arbitrary last children).
- Assistant footer (only when not streaming): `.btn-icon` `copy` (copies raw Markdown; shows `check` for 1.5 s).
  The copy action stays visible on desktop and touch.
- Errors: a row with `alert-circle` in `--danger` and `--fs-sm` text `回复生成失败：{error}`; cancelled: `--text-3`
  `已停止生成`. Both replace the old `⚠️` text.
- Inline citation (`Citation.tsx`, rendered by `MessageContent`): `<button class="cite">n</button>` — 18 px tall,
  min-width 18 px, `--fs-xs` 600, bg `--accent-bg`, colour `--accent`, radius `--r-full`, `margin: 0 2px`,
  `vertical-align: super`; hover bg `--accent`, colour `--accent-fg`. Hover or keyboard focus shows a flat tooltip
  containing the resolved page title (frontmatter `title`, then the first H1). Use the same cached resolution for
  the tooltip and navigation; clicking or tapping opens that page. The title-only bubble sizes to its text, with
  `6px 10px` padding and `--r-md`. Render it in a fixed-position portal bounded to the viewport, so tables and
  scrolling readers do not clip it. It remains open while hovered or focused and dismisses on Escape.
  Use `role="tooltip"` and `aria-describedby`; keep the `%%REF:n%%` pipeline.

**3.5 Scroll behaviour.** Keep `shouldFollow` (within 48 px of the bottom). When not following and content grows, show
a floating `.btn-icon-round` `arrow-down` (bg `--bg`, border 1 px `--border`, `--shadow-popover`) centred above the
composer; click scrolls to bottom and re-enables following. When the user sends a message, always follow.

**3.6 Header title.** The chat header shows the topic (`--fs-md` 500 `--text-2`, truncate). Clicking it opens the same
rename input as the sidebar (nice to have).

**Acceptance (Phase 3)**
- Visually matches the wireframe and Part 2 at 1440 px and 375 px widths, light and dark.
- Long code blocks, wide tables and long `$$` formulas scroll horizontally inside the 768 px column; the page never
  scrolls horizontally.
- Copy button copies the message Markdown. Inline citations open the right document and view; hover and keyboard
  focus show the linked page's actual title, and Escape dismisses the tooltip.
- Phase 0 performance acceptance still holds.

### Phase 4 — Library (Wiki and 课件)

One component `views/library/Library.tsx` with `kind: 'wiki' | 'lectures'` derived from `route.view`.

```
┌ 280px list ─────────┬──────────────── reader ───────────────────────────┐
│ [🔍 搜索 Wiki…     ] │ Wiki / 动态规划                                    │  breadcrumb --fs-sm --text-2
│ 索引            1    │                                                   │
│  index              │   Bellman 方程                                     │  H1 24/600
│ 动态规划        12   │   标签: [最优控制] [DP]   更新: 2026-03-02          │  from frontmatter
│  Bellman 方程   ◀    │                                                   │
│  值函数迭代          │   正文 … 16/1.75, max-width 760px, centred         │
│  …                  │                                                   │
└─────────────────────┴───────────────────────────────────────────────────┘
```

**4.1 List pane (`FileList.tsx`).** Width 280 px, bg `--bg-sidebar`, `border-right: 1px solid var(--border)`. Top:
search input (search variant, placeholder 搜索 Wiki… / 搜索课件…, filters title + path + full text with
`useDeferredValue`). Wiki: groups by top-level directory, `index.md` group first labelled 索引, group label
`--fs-xs` 500 `--text-3` with count right-aligned; items are list-items (36 px) with `aria-current` when active.
Lectures: flat list, title or basename. Drop the tag pills from list items (they are shown in the reader header). Empty
states: 暂无笔记 / 暂无课件 / 没有匹配结果, `--fs-sm` `--text-3`, centred.
When `route.file` changes, scroll the active item into view (`scrollIntoView({ block:'nearest' })`).

**4.2 Reader (`Reader.tsx`).** Header 48 px: breadcrumb `Wiki / <topic>` or `课件` (`--fs-sm` `--text-2`), mobile back
button. Body: `max-width:760px; margin:0 auto; padding:24px 16px 48px`. Parse YAML frontmatter client-side
(`lib/frontmatter.ts`: split on the leading `---` block, read `title`, `date`, `tags`), render title as H1, tags as neutral
badges, date as `--fs-sm` `--text-3`; render the remaining Markdown with the shared `.md` styles and the same
`ReactMarkdown` configuration as chat (`remarkGfm`, `remarkMath`, `rehypeKatex {output:'html'}`). Internal links keep
the existing `resolveWiki(href, selected.abs_path)` flow but call `navigate()`; external links open in a new tab with
`external-link` icon. Empty reader: 选择左侧文件查看内容 `--fs-sm` `--text-3` centred.
Loading: a single `loader` spinner (rotate only) centred, no text; error: `alert-circle` + message.

**4.3 Data.** Use `getWikiCached()` / `getSourcesCached()` (3.3). Fetch file content once per `route.file` change with
an `AbortController` cancelled on change (fixes the triple fetch). Cache the last 10 documents' content in module scope.

**4.4 Mobile.** List fills the screen; with `route.file` set, the reader fills the screen and the header shows
`chevron-left` 返回 which navigates to `{ view, file: undefined }`.

**Acceptance (Phase 4)**
- A citation to a wiki page opens `?view=wiki&file=…`, the Wiki nav item is active, the item is highlighted and
  scrolled into view. A lecture citation does the same under 课件.
- Search on a 200-page wiki stays responsive while typing (no dropped frames in the Performance panel).
- Each document is fetched once per open. Back/forward move between documents.

### Phase 5 — Learning, Status, Settings, Login

**5.1 Learning.** Keep the information architecture (students → sessions → record; summaries). Restyle only:
- Delete the private palette in `Learning.css`; use tokens. Delete the English kickers and `lr-admin-label`.
- Page header: title 学习情况 `--fs-h2`; segmented control 学生问答记录 / 全班问题摘要.
- Overview stats: numbers `--fs-h2` 500, labels `--fs-sm` `--text-2`, no icons.
- Workspace: `.panel` with `overflow:hidden`; inner panes separated by 1 px borders; roster/session items use the
  shared list-item style; avatars are 28 px round `--bg-muted`.
- Records: turn number `--fs-sm` 500 `--text-3`, status `.badge` variants, question in `.md` 16 px, answer block bg
  `--bg-muted` radius `--r-lg` padding 16 with label 助教回答 `--fs-sm` 500 `--text-2`.
- Summaries: same reader typography as the library. Primary action `生成新摘要` = `.btn-primary`; refresh = `.btn-ghost`.
- Replace its `Icon` with `components/Icon`.

**5.2 Status.** `max-width: 960px` grid of `.panel`s (`repeat(auto-fill, minmax(320px,1fr))`, gap 16). Panel title
`--fs-sm` 500 `--text-2` (no uppercase, no letter-spacing). Rows: label `--text-2`, value `--text` 500, 1 px `--border`
separators, values right-aligned with `font-variant-numeric: tabular-nums`. Badges per 2.7. Remove all inline styles
(`Status.tsx:211-218`) in favour of a `.status-subrow` class. No hover effects.

**5.3 Settings.** Sections as `.panel`s with `--fs-h3` titles: 账号与安全 (password form: two `.input`s, `.btn-primary`
修改密码, inline success in `--success` / error in `--danger` `--fs-sm`); admin only: 配置 (settings.toml rows in
`--font-mono` `--fs-sm`), 环境变量. Remove the Settings logout button (it lives in the user menu). Only call
`/api/settings` when `me.role === 'admin'`. Delete the onboarding banner and tips boxes; keep a one-line hint under
the API key row when it is missing.

**5.4 Login (`views/Login.tsx`).** Full-page `--bg`, centred 360 px column: logo 40 px, 厦门大学课程辅助系统 `--fs-h2`,
动态优化课程 · Frankie 助教 `--fs-sm` `--text-2`, two `.input`s (40 px) with labels `--fs-sm` 500, `.btn-primary` 40 px
full width 登录 (no letter-spacing), error `--danger` `--fs-sm`. No gradient, no card shadow, no card at all. Footer
`--fs-xs` `--text-3`.

**Acceptance (Phase 5)**
- No colour, radius or shadow value appears outside `tokens.css` (`grep -rnE '#[0-9a-fA-F]{3,8}|rgba?\(' src --include=*.css | grep -v tokens.css` is empty).
- Admin flows unchanged functionally: student records load, summary generation works, config displays.

### Phase 6 — Dark mode, mobile pass, cleanup

**6.1 Theme toggle.** `hooks/useTheme.ts`: state `'system' | 'light' | 'dark'` in `localStorage['frankie.theme']`;
apply `data-theme` on `<html>` (remove the attribute for `system`). Inline a 3-line script in `index.html` `<head>` that
applies the stored value before first paint to avoid a flash. User menu → 外观 submenu or a three-way segmented
control (跟随系统 / 浅色 / 深色). KaTeX inherits `color`, so formulas follow the theme; check code blocks and images.

**6.2 Mobile pass** at 375 × 667 and 390 × 844: drawer, composer (16 px font to prevent iOS zoom), safe-area insets
(`padding-bottom: env(safe-area-inset-bottom)` on the footer), reader back button, library list, Learning drill-down
(already exists), Login.

**6.3 Cleanup.** Delete `public/icons.svg`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png` (grep
first), `package-lock.json`. Replace `frontend/README.md` with a 20-line real README (dev/build commands, folder
layout, design system pointer to this document's Part 2). Remove the `.dev-*` class names and any "开发联调" wording.

**6.4 Bundle split (optional).** `React.lazy` the Learning, Status and Settings views. Dynamic-import
`MessageContent`'s KaTeX pieces is not worth it (chat needs them immediately); leave as is.

**6.5 Final audit.** Run the Global QA checklist below on both themes; update `CHANGELOG.md`; rebuild; deploy per
`deploy/README.md`.

---

## Global QA checklist (run before each PR)

Performance
- [ ] Hold Backspace 5 s in a long formula-heavy chat: main thread < 15 % busy, no long tasks.
- [ ] `document.getAnimations()` is empty when idle (thinking dots allowed only while generating).
- [ ] Streaming a long answer: frame rate stays ≥ 50 fps in the Performance panel.
- [ ] `pnpm --dir frontend build` succeeds with zero TypeScript and ESLint errors (`pnpm --dir frontend lint`).

Behaviour
- [ ] Enter sends; Shift+Enter newlines; Enter during IME composition does nothing.
- [ ] Typing, attaching and stopping work while generating; the draft survives.
- [ ] Citation → correct view + tab + highlighted item; browser Back returns to the chat with the answer intact.
- [ ] Rename / delete sessions inline; deleting the open session opens a new chat.
- [ ] Refresh preserves the current session and view; sidebar collapse state persists.
- [ ] Logout returns to Login; login lands on a new chat.

Visual
- [ ] Only tokens in component CSS; no gradients, glows, blurs, transforms on hover, or emoji.
- [ ] Radii come from the six tokens; font sizes from the type scale; weights 400/500/600 only.
- [ ] Both themes: text contrast ≥ 4.5:1 for body text (`--text-2` on `--bg` passes; `--text-3` is for non-essential text only).
- [ ] Focus ring visible on every interactive element via keyboard Tab.
- [ ] No horizontal page scroll at 375 px, 768 px, 1024 px, 1440 px.

---

## Appendix A — Do / Don't for component work

| Do | Don't |
|---|---|
| Use `var(--token)` for every colour, radius, shadow, font size. | Write a hex/rgba value or a pixel radius in a view stylesheet. |
| Add a class and a rule in the view's CSS file. | Use inline `style=` for static styling. |
| Use `<Icon name>`. | Use emoji or Unicode symbols (`☰ ✎ × ↑ ■`) as icons. |
| Change `background-color`/`color`/`opacity` on hover. | Move, scale, glow or shadow things on hover. |
| Keep state as close to the input as possible (composer owns its draft). | Lift keystroke state into a component that renders the message list. |
| Read navigation state from `useRoute()`; change it with `navigate()`. | Touch `history` or `window.location` directly, or dispatch custom events. |
| Memoise anything that renders Markdown. | Create new callback/object props on every render for memoised children. |
| Delete dead code when replacing it. | Comment it out or add another override layer. |

## Appendix B — Reference snippets

Date grouping (`lib/dates.ts`):

```ts
export function groupLabel(iso: string, now = new Date()): string {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.floor((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return '最近 7 天'
  if (days < 30) return '最近 30 天'
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}
```

Memoised message item:

```tsx
export const MessageItem = memo(function MessageItem({ message, agentStatus, onOpenRef }: Props) {
  /* render per 3.4 */
})
// In MessageList: <MessageItem key={m.id} message={m} agentStatus={m.streaming ? agentStatus : ''} onOpenRef={onOpenRef} />
// onOpenRef in Chat: const onOpenRef = useCallback((target: string) => { ... navigate(...) }, [])
```

Textarea auto-resize without an effect:

```tsx
const resize = (el: HTMLTextAreaElement) => { el.style.height = '0px'; el.style.height = `${Math.min(el.scrollHeight, 200)}px` }
<textarea onChange={(e) => { setInput(e.target.value); resize(e.target) }} />
/* CSS: @supports (field-sizing: content) { .composer-textarea { field-sizing: content; max-height: 200px; } } */
```

Frontmatter split (`lib/frontmatter.ts`):

```ts
export function splitFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { meta: {}, body: src }
  const meta: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["'\[]|["'\]]$/g, '')
  }
  return { meta, body: src.slice(m[0].length) }
}
```
