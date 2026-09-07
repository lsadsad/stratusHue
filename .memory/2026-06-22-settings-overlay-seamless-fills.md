---
type: decision
tags: [navigate, settings, ui, visual]
created: 2026-06-22
---

# Settings overlay visual refinement (borderless groups)

## Decisions

- Removed the outer card treatment from settings groups (`Connection & Appearance`, `Editing Defaults`, `Navigation`) and kept emphasis on titled inner sections.
- Kept section titles floating over the section border with explicit background fill so borders remain clean under overlap.
- Reduced settings paddings for a denser overlay layout.
- Unified settings canvas and section fills to the same background token for a seamless appearance.

## Notes

- The support/ice-cream block is intentionally borderless to match the borderless group presentation.
- This extends (not replaces) `.memory/2026-06-22-settings-overlay-layout-accessibility.md`.
