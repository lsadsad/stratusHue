---
type: decision
tags: [navigate, settings, accessibility, responsive, bridge]
created: 2026-06-22
---

# Settings overlay layout + accessibility baseline

## Decisions

- **Settings should use grouped cards, not a flat stack.** The overlay now has
  higher-level groups ("Connection & Appearance", "Editing Defaults",
  "Navigation") plus bordered inner sections so related controls scan faster.
- **Bridge belongs at the top.** It is now surfaced before theme and editing
  defaults, reflecting that it is a global capability toggle rather than a
  secondary preference.
- **Overlay should fill the available plugin space, not float as a smaller modal.**
  Outer overlay padding is fixed at 40px top/bottom, inner content keeps 16–24px
  horizontal spacing, and horizontal overflow is explicitly suppressed.
- **Date segmented controls use accessible single-select semantics.** They are
  implemented as `radiogroup` + `role="radio"` buttons with `aria-checked`
  tracking and keyboard navigation (`Arrow*`, `Home`, `End`, `Enter`, `Space`).
- **Editing Defaults must stack gracefully on narrow widths.** Nudge inputs and
  date rows switch to a tighter responsive layout instead of compressing into
  unreadable inline controls.

## Verified

- `settings-ui` tests now cover segmented-control keyboard navigation and
  `aria-checked` state updates.
