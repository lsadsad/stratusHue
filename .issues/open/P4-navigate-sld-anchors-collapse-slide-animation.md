---
id: sld
category: navigate
title: "Restore slide animation on Anchors section collapse/expand"
type: task
priority: 4
status: open
depends_on: []
created: 2026-06-15
---

## Description

The `anh` fix set `#anchors-section:not(.collapsed) { max-height: none }` so the
anchors list grows to natural height. Side effect: collapsing/expanding the Anchors
section now snaps (with an opacity fade) instead of sliding, because `max-height`
can't interpolate between `none` and `0`. The other collapsible sections (Tags,
Controls) still slide — only Anchors changed.

## Recommended approach

JS-driven animate-to-content-height in `toggleSection` (`src/ui/navigate/navigate-ui.ts`):

- Expand: set inline `maxHeight = '0'`, remove `.collapsed`, force reflow, set inline
  `maxHeight = scrollHeight + 'px'` (animates 0 → content). On `transitionend`, clear
  the inline `maxHeight` so the section is unbounded again and can grow as anchors are
  added.
- Collapse: set inline `maxHeight = scrollHeight + 'px'`, force reflow, add
  `.collapsed`, set inline `maxHeight = '0'` (animates content → 0).
- The base CSS for the expanded anchors section stays `max-height: none` (handles
  initial load + dynamic growth); inline styles only exist transiently during the
  animation.

## Notes

- P4: cosmetic. The functional bug (`anh`) is fixed; this only restores polish.
- Timing-sensitive (reflow + transitionend); the iframe already uses transitionend in
  `toggleSection`, but verify in the real Figma runtime, including rapid toggles and
  adding anchors while expanded.
