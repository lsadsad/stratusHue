---
id: anim
category: meta
title: >-
  Resolve animation docs contradiction — Lottie pipeline exists but rules say
  'No Lottie'
type: bug
priority: 3
status: closed
depends_on: []
created: '2026-03-28'
---

## Problem

The animation documentation contradicts itself:

- `.cursor/rules/icons-and-animation.mdc` (line 94) states: **"No Rive, no Lottie — both require runtime libraries incompatible with Figma's `networkAccess: none` constraint."**
- `docs/LOTTIE_SUPPORT.md` documents a full Lottie pipeline as if it's live and ready to use.
- `lottie-web` is installed as a dependency and the build system inlines Lottie JSON via `data-lottie` attributes.
- `src/ui/shared/lottie.ts` has the full management layer (play/pause/stop/destroy) but the actual `lottie.loadAnimation()` call is **commented out** with `"Lottie animation disabled for debugging"`.
- A sample asset exists at `assets/sample-loading.json`.

## Decision needed

1. **Keep Lottie** — re-enable the runtime, update the cursor rule to reflect that Lottie is supported, verify it works inside Figma's sandboxed iframe.
2. **Remove Lottie** — delete `lottie-web` dependency, `src/ui/shared/lottie.ts`, `docs/LOTTIE_SUPPORT.md`, `assets/sample-loading.json`, and any build-system Lottie inlining logic. The cursor rule is already correct in this case.

## Affected files

- `.cursor/rules/icons-and-animation.mdc`
- `docs/LOTTIE_SUPPORT.md`
- `src/ui/shared/lottie.ts`
- `assets/sample-loading.json`
- `esbuild.config.js` (Lottie inlining logic)
- `package.json` (`lottie-web` dependency)
