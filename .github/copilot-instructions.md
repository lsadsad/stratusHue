# stratusHue — Copilot Instructions

## Project Overview
stratusHue is a **Figma plugin** (TypeScript + esbuild). Two isolated processes: sandbox (`src/code.ts`, has `figma.*`) and UI iframe (`src/ui.ts`, has DOM). Never mix their imports.

## Issue Tracking
This project uses **bd (beads)** — see `.vscode/beads.instructions.md` for full CLI reference.  
`bd ready` before starting. `bd dolt push && git push` before ending.

## Key Commands
```bash
npm run dev              # watch build with sourcemaps
npm run build            # dev build
npm run build:prod       # minified production build
npm run type-check       # tsc --noEmit (both tsconfigs)
npm run lint             # ESLint
npm run test             # vitest --run
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

## Scaffold Mode (Phase 3 — in design)
Discovery matrix: `docs/features/FIGMA_FIGJAM_MATRIX.md`  
Recipe file: `docs/features/recipes/product-design-full.recipe.json`  
Beads issue: `stratusHue-sob` (schema), `stratusHue-xq7` (loader/parser)  
`src/ui/scaffold/scaffold-ui.ts` is a 4-line placeholder — do not implement until matrix is approved.

## Prototype
`prototype/plugin.html` is generated — never edit directly. Run `npm run sync:prototype` to regenerate.
