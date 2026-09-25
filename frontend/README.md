# Frankie frontend

React, TypeScript, and Vite client for the Frankie course assistant.

## Commands

Start the API server from the repository root:
```bash
uv run frankie web
```
Run frontend commands from `frontend/`:
```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:math-copy
```
Vite runs at `http://localhost:5173`, proxies `/api` to port 7860, and writes production builds to `dist/`.

`pnpm test` checks the conversation send logic with a mocked network boundary. `pnpm test:math-copy` checks Unicode math conversion, real DOM selections, Chat/Wiki/Lecture rendering, and native plain/rich-text clipboard paste in Chromium.

## Layout

Application code is under `src/`: screens in `views/`, shared UI in `components/`, the backend client in `api/`, and the design system in `styles/`. Static branding assets live in `public/`.
