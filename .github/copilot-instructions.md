# Copilot Instructions — stratusHue

Thin **Copilot-specific overlay**. Canon lives elsewhere — do not duplicate it here.

## Instruction hierarchy (VS Code + Copilot)

| Source | Role |
|--------|------|
| **`CLAUDE.md`** | Plugin architecture + scoped Throughline import + repo config (always-on) |
| **`AGENTS.md`** | Cross-tool agent workflow (always-on) |
| **`docs/finePrint.md`** | Issues, memory, shortHand (extracted from `CLAUDE.md`) |
| **This file** | Copilot pointers + essential plugin commands |
| **`.github/instructions/*.instructions.md`** | Path-specific rules (e.g. scoped Throughline on design specs / memory) |
| **`.cursor/rules/*.mdc`** | Cursor-only (prototype, icons, functional testing, conventions) |

Throughline / visual-craft depth is **not** always-on and does **not** govern plugin code. For Figma design-critique work, Copilot applies `.github/instructions/throughline-visual-craft.instructions.md` → read `CLAUDE-throughline.md` + `CLAUDE-visual-craft.md` with scope guardrails in `CLAUDE.md` § Design methodology.

## Project Overview

stratusHue is a **Figma plugin** (TypeScript + esbuild). Two isolated processes: sandbox (`src/code.ts`, has `figma.*`) and UI iframe (`src/ui.ts`, has DOM). Never mix their imports.

## Key Commands

```bash
npm run dev              # watch build with sourcemaps
npm run build            # dev build
npm run build:prod       # minified production build
npm run type-check       # tsc --noEmit (both tsconfigs)
npm run lint             # ESLint
npm run test             # vitest --run
npm run validate         # lint + build
npm run sync:prototype   # build + patch prototype/plugin.html
```

## Architecture Rules

- Sandbox files must begin with `/// <reference types="@figma/plugin-typings" />`
- UI files must never import anything that references `figma.*`
- `src/ui/ui-communication.ts` and `src/ui/index.ts` are **sandbox-side** despite living in `src/ui/`
- Use `sendMessage()` from `src/ui/shared/send-message.ts` — never call `parent.postMessage` directly
- All `figma.ui.postMessage` calls are centralised in `src/ui/ui-communication.ts`
- All async node lookups: `figma.getNodeByIdAsync(id)` — not the sync version
- Wrap feature handlers: `withErrorBoundary(fn, ErrorType.X)` from `src/core/error-handling.ts`
- New `figma.ui.onmessage` types need a smoke test in `src/test/smoke-dispatch.test.ts` — see `CLAUDE.md` § Smoke Tests

## Scaffold Mode (Phase 3 — in design)

Discovery matrix: `docs/features/specs/figmaFigjamMatrix.md`
Recipe file: `docs/features/recipes/product-design-full.recipe.json`
Issues: `.issues/open/P1-sob-recipe-json-schema.md` (schema), `.issues/open/P1-xq7-recipe-loader-parser.md` (loader/parser)
`src/ui/scaffold/scaffold-ui.ts` is a 4-line placeholder — do not implement until matrix is approved.

## Prototype

`prototype/plugin.html` is generated — never edit directly. Run `npm run sync:prototype` to regenerate.

## Issue and memory tracking

`.issues/open|closed/` + `.memory/` — schema and trigger phrases: **`docs/finePrint.md`**.

## Shell (non-interactive)

Use `cp -f`, `mv -f`, `rm -f` / `rm -rf` — interactive aliases hang agents. See `AGENTS.md`.

## Key references

| Need | File |
|------|------|
| Plugin architecture (full) | `CLAUDE.md` |
| Throughline scope + precedence | `CLAUDE.md` § Design methodology |
| Throughline methodology depth | `CLAUDE-throughline.md` (on-demand) |
| Visual craft doctrine | `CLAUDE-visual-craft.md` (on-demand) |
| finePrint (issues, memory, shortHand) | `docs/finePrint.md` |
| Figma functional debugging | `docs/fixes/FIGMA_FUNCTIONAL_DEBUG_PLAYBOOK.md` |
