---
type: context
tags: [build, svg, icons, sizing-modes, innerHTML]
---

# Build inlines SVG assets — cannot swap via img.src at runtime

**Date:** 2026-06-18

## What happened

Sizing mode icons (Fixed / Fill / Hug) were stuck on Fixed regardless of selection. Three commits were needed to reach the real fix.

## Root cause

The esbuild config replaces every `<img src="./assets/ICO-*.svg">` tag in `ui.html` with the raw inline `<svg>` element at build time. At runtime there is **no `<img>` inside the span** — only an `<svg>` node.

Code that tried to:
- set `span.src = dataUri` → no-op (spans have no `.src`)
- `span.querySelector('img').src = ...` → `querySelector` returns `null` because the `<img>` was replaced

## Correct pattern for runtime icon swapping

Replace the **`innerHTML` of the wrapper span** with the inline SVG string:

```ts
const span = document.getElementById('my-icon');
if (span) span.innerHTML = ICON_SVG_STRING;
```

Store icon strings as single-line SVG constants (same format as `src/ui/shared/icons.ts`).

## Where this applies

Any icon inside a `<span>` that is initially set via `<img src="./assets/ICO-*.svg">` in `ui.html`. The `<img>` only exists in source — it is gone after `npm run build`.

## Files affected

- `src/ui/navigate/bookmarks-ui.ts` — `updateLayoutSizingButtons()`
