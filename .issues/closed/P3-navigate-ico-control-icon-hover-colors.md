---
id: ico
category: navigate
title: "Functional color on control icon hover"
type: feature
priority: 3
status: open
depends_on: []
created: 2026-03-28
---

# Functional color on control icon hover

Add hover states to Controls section icons that apply function-specific colors, making each button's purpose self-documenting on interaction.

## Color mapping

| Function | Color | Rationale |
|---|---|---|
| Arrows (up/down/left/right) | `--figma-color-border-brand` (blue) | Spatial movement — matches Figma selection |
| Zoom (in/out/100%/selection) | Green `#30a46c` | Viewport control |
| Delete | Red `#e5484d` | Destructive |
| Hierarchy nav (enter/exit/prev/next) | Amber `#f5a623` | Tree traversal |
| Layer order (forward/backward) | Purple `#8e4ec6` | Z-stack ordering |
| Visibility (show/hide) | Cyan `#05a2c2` | "Seeing" |
| Lock | Orange `#e54d2e` | Constraint/protection |
| Collapse | Muted `--color-text-secondary` | Utility, low emphasis |
| Sizing (width/height) | Teal `#12a594` | Layout control |
| Styled Text (paste/copy) | Pink `#d6409f` | Content/clipboard |

## Implementation

CSS-only: apply `filter` or `color` overrides on `.nav-button-{type}:hover .nav-icon` selectors. Icons use `stroke="currentColor"` so `color` inheritance should work.
