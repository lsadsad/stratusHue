---
id: anh
category: navigate
title: "Anchors panel height doesn't account for 14+ items; list overlaps Controls"
type: bug
priority: 2
status: closed
depends_on: []
created: 2026-06-15
closed: 2026-06-15
---

## Description

With 14+ anchors, the Anchors list rendered past its container and overlapped the
Controls section, and the plugin window did not grow to fit. Reported with
screenshots in real Figma. (The `anc` persistence fix was confirmed working in the
same session — no save errors — so this is a separate, purely visual/layout bug.)

## Root cause

A CSS interaction, not JS:

- `#anchors-section` has `overflow: visible` (`styles.css:4464`; its ID selector beats
  `.collapsible-content { overflow: hidden }`) but inherited `max-height: 600px` from
  `.collapsible-content` (`styles.css:1869`). Once the list passed ~600px (~12 items),
  the extra anchors painted *past* the 600px box and overlapped Controls.
- `computeFitHeight()` (`src/ui/shared/layout.ts`) sums each section's `offsetHeight`,
  which was the clamped 600px — so auto-fit under-measured and never grew the window.

## Fix

`#anchors-section:not(.collapsed) { max-height: none; }` — the anchors list is the
only collapsible section with unbounded content, so let its expanded state grow to
natural height. Auto-fit then grows the window up to `MAX_UI_HEIGHT` (800) and
`<main>` scrolls beyond that. Verified in real Figma: no overlap, window fits /
scrolls correctly.

## Tradeoff / follow-up

Collapsing the Anchors section now snaps closed with an opacity fade instead of
sliding (`max-height: none → 0` can't interpolate). Other sections keep their slide.
Restoring the slide via a JS-driven animate-to-content-height approach is tracked in
issue `sld` (P4).

## Notes

- CSS-only fix; not unit-testable in jsdom (no layout engine). Verified manually in
  the Figma runtime per the repo's Figma debugging playbook.
- General trap: `.collapsible-content { max-height: 600px }` clips/overlaps any future
  section whose content can exceed 600px — override `max-height` for variable-height
  collapsible sections.
