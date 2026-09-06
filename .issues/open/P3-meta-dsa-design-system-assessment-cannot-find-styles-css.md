---
id: dsa
category: meta
title: "design-system-assessment integration tests can't locate src/styles.css under full vitest run"
type: bug
priority: 3
status: open
depends_on: []
created: 2026-06-15
---

## Description

`tools/design-system-assessment/integration.test.ts` fails 7 cases under
`npm run test`:

```
Error: Failed to analyze design system: Could not find styles.css file in any of the expected locations
 ❯ analyzeDesignSystem tools/design-system-assessment/index.ts:94
```

## Root cause (corrected after investigation)

The filed "cwd path resolution" hypothesis was **wrong**. The actual cause:
`css-loader.ts`'s `loadCSSFromFile` branched on `typeof window !== 'undefined'` to
pick `fetch` (browser) vs `fs` (Node). Under vitest's **jsdom** environment `window`
is defined even though we're in Node, so it took the `fetch` path — which can't read
a local file path — and every candidate path failed.

Peeling that back exposed **three further, independent layers** of drift (each was
masked by the previous one):

1. **Stray `}` in `src/styles.css`** (line ~7689). The tool's brace validator
   rejected the real stylesheet (984 `{` vs 985 `}`). Browsers/esbuild tolerate the
   extra brace, so the plugin built fine — but it was a genuine latent CSS defect.
2. **Token parser hardcodes 3 themes** (`token-parser.ts:30` — `root`, `cybertron`,
   `figma-light`) while `src/styles.css` now has 7 `[data-theme]` variants
   (`boilerplate`, `light`, `dark`, `figma-dark`, `figma` added since). The
   integration tests assert `themes` contains `boilerplate`. Extending the array is
   correct but **cascades**: the tool's own unit tests hardcode `expect(themes.length).toBe(3)`,
   and the renderer/resolver assume every token has a value for every theme.
3. **`createComparisonTable` returns null on real analyzed data** (DOM tests get
   `expected null to be truthy`), and the theme-value resolver yields **0 valid
   tokens** for the real stylesheet — both independent of theme count, both
   surfaced only once the CSS actually loaded.

## What was fixed (2026-06-15)

- `css-loader.ts` now prefers Node `fs` whenever a Node runtime is present (covers
  jsdom + Node CLI), falling back to `fetch` only in a real browser. **Kept.**
- Removed the stray `}` in `src/styles.css` — a real shipped-CSS bug. **Kept**
  (fixed independently; see commit / closed work).

## What remains (this issue stays open)

Layers 2 + 3 are an open-ended rework of a **dev-only** tool: make the parser,
renderer, and value resolver 7-theme-aware and handle sparse theme coverage, then
re-sync the tool's own 3-theme test fixtures. Per decision this session, the tool's
tests were **scoped out of the plugin gate** rather than reworked now.

## Decision

- `vitest.config.ts` now excludes `tools/**` from the default `npm run test` (the
  gate covers shipped plugin code only — `src/test`). Run the tool suite manually
  with `npx vitest --run tools/design-system-assessment/`.
- `tools/design-system-assessment` is a dev/analysis utility, not shipped plugin
  code — hence not blocking the plugin gate. Reopen the rework when the tool is
  needed again.

## Notes

- Pre-existing; unrelated to the `anc` bookmark fix.
