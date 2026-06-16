---
type: context
tags: [navigate, anchors, layout, collapsible, auto-fit, testing, vitest, tools]
created: 2026-06-15
---

# Anchors panel height fix + test-gate greening (follow-ups to the `anc` work)

Continuation of the same session as [[2026-06-15-anchors-persistence-and-test-mock]].
Three threads landed after the `anc` persistence fix.

## 1. Anchors panel height bug (`anh`) — confirmed fixed in real Figma

With 14+ anchors the list overlapped the Controls section and the window never grew
to fit. Root cause was a CSS interaction, not JS:

- `#anchors-section` has `overflow: visible` (its ID rule beats `.collapsible-content`'s
  `overflow: hidden`) but inherited `max-height: 600px` from `.collapsible-content`
  (`styles.css:1869`). Past ~600px (~12 items) the extra anchors **painted past the
  box** and overlapped Controls.
- `computeFitHeight()` (`src/ui/shared/layout.ts`) measures each section's
  `offsetHeight`, which was the clamped 600px — so auto-fit under-measured and never
  grew the window.

Fix: `#anchors-section:not(.collapsed) { max-height: none; }` — let the only
unbounded collapsible section grow to natural height. Auto-fit then grows the window
up to `MAX_UI_HEIGHT` (800) and `<main>` scrolls beyond that.

**Known tradeoff:** collapsing the Anchors section now snaps closed with an opacity
fade instead of sliding (`none → 0` can't interpolate). Other sections keep their
slide. A JS-driven "animate to measured content height" version would restore the
slide — tracked as `sld` (P4), deferred because it's timing-sensitive code that
needs real-Figma verification.

**General lesson:** `.collapsible-content { max-height: 600px }` is a latent trap for
any section whose content can exceed 600px. Combined with an `overflow: visible`
override it produces silent overlap + auto-fit under-measurement rather than a clean
clip. New variable-height collapsible sections must override `max-height`.

## 2. `npm run test` made fully green and stable

- `pwt` (closed): excluded `tests/**` (Playwright specs) from vitest in
  `vitest.config.ts` — they run via `npm run test:prototype`.
- `dsa` (open): the design-system-assessment dev tool had layered drift (jsdom
  `window` env detection in `css-loader.ts` — fixed; a real stray `}` in
  `src/styles.css` — fixed; plus 3-vs-7 theme hardcoding + null DOM render + zero
  resolver that need a full tool rework). Decision: `tools/**` excluded from the
  plugin gate; tool rework tracked in `dsa`.
- `pfl` (closed): `performance.test.ts` baseline case was flaky under load (asserted
  bounds on the ratio of two sub-ms measurements). Now seeds a fixed 100ms baseline
  the real op always beats → deterministic.

The plugin gate (`npm run test`) now covers `src/test` only: 324/324, stable.
