---
id: anim-ref
category: meta
title: "TSK — Animation system reference"
type: task
priority: 4
status: open
depends_on: []
created: 2026-03-28T00:00:00.000Z
---

## Purpose

Single reference for the plugin's animation pipeline — what exists, what's active, what's dormant, and how to extend it.

## Animation tiers

### Tier 1 — CSS `@keyframes` (active)

Zero-runtime-cost animations applied to inline SVGs and UI elements. This is the primary animation system.

**Keyframes defined in `src/styles.css`:**

| Name | Line | Duration | Usage |
|------|------|----------|-------|
| `theme-loading-spin` | 435 | 1s linear infinite | Theme loading spinner |
| `theme-focus-pulse` | 462 | 1s ease-in-out infinite | Focus ring pulse on theme buttons |
| `cybertron-glow` | 543 | 0.3s ease-in-out | Cybertron theme glow effect |
| `subtle-pulse` | 4588 | 2s ease-in-out infinite | Generic subtle pulse (e.g. scan progress) |
| `spin` | 4826 | 1s linear infinite | General rotation spinner |

**Transition tokens:**

| Token | Value |
|-------|-------|
| `--transition-fast` | 150ms ease-out (0.12s ease in dark) |
| `--transition-normal` | 200ms ease-out (0.2s ease in dark) |
| `--transition-slow` | 300ms ease-out (0.3s ease in dark) |

**Accessibility:** `prefers-reduced-motion: reduce` and `.reduced-motion` class disable all animations via `animation: none !important` (multiple rules throughout `styles.css`).

### Tier 2 — Animated SVG (available, not widely used)

Self-contained `<style>` blocks inside `.svg` files for path-level effects:
- `stroke-dasharray` / `stroke-dashoffset` for draw-on
- Can be prototyped by opening the `.svg` directly in a browser

### Tier 3 — Lottie (dormant infrastructure)

Full pipeline exists but is **not wired into active UI code**.

| Component | Path | Status |
|-----------|------|--------|
| Runtime library | `lottie-web` (npm) | Installed, import commented out |
| Management module | `src/ui/shared/lottie.ts` | Exists, `loadAnimation()` commented out |
| Build inlining | `esbuild.config.js` | `data-lottie-src` → `data-lottie` replacement active |
| Sample asset | `assets/sample-loading.json` | Present |
| Usage docs | `docs/LOTTIE_SUPPORT.md` | Updated with dormant status + re-enabling steps |

**To re-enable:** see `docs/LOTTIE_SUPPORT.md` "Re-enabling Lottie" section. Key steps: uncomment `loadAnimation()`, import helpers in mode UI, add `data-lottie-src` to HTML.

**Why dormant:** Was disabled for debugging and never re-enabled. Lottie JSON is inlined at build time so it does work within Figma's `networkAccess: none` constraint — no external fetches needed.

### Not supported — Rive

Rive requires a runtime that fetches external `.riv` files, incompatible with Figma's sandboxed iframe. Rive Preview is tracked as a separate standalone plugin concept (`docs/standalone/rive-preview/`).

## Reference docs

| Document | Role |
|----------|------|
| `.cursor/rules/icons-and-animation.mdc` | Canonical rules — icon system, SVG prep, all three tiers, prototype workflow |
| `docs/LOTTIE_SUPPORT.md` | Lottie-specific: setup, config attributes, JS API, re-enabling steps |
| `prototype/anim-playground.html` | Standalone dark-themed page for iterating on SVG/CSS animations before moving to `styles.css` |

## Theme transitions

Theme switching uses `.theme-transitioning` class (300ms) with `will-change` on specific components only — never the universal selector. Defined in `src/ui/shared/theme-manager-ui.ts`.

## Workflow for adding new animations

1. Prototype in `prototype/anim-playground.html` (`npx serve prototype`)
2. Once approved, move `@keyframes` to `src/styles.css`
3. Apply via CSS selectors on inline SVG elements (`:active`, `:hover`, class toggles)
4. Ensure `prefers-reduced-motion` / `.reduced-motion` disables it
5. For Lottie: follow re-enabling steps in `docs/LOTTIE_SUPPORT.md`
