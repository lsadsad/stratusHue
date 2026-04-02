# Color-Coded Header Action Icons

## Overview
This document describes the current color-context behavior for header action icons in Navigate mode.

The behavior is now section-level:
- Hover/focus on a section header turns on a color-context class.
- Icons in that header switch from muted monochrome to semantic colors.
- Individual button hover/active states still apply, but the section context drives the default reveal.

## Current Implementation

### Source of truth
- `src/ui/navigate/navigate-ui.ts` toggles `.header-color-context-active` on:
  - `#tags-header`
  - `#anchors-header`
  - `#controls-header`
- `src/styles.css` maps icon filters for each action when that class is active.

### Selector model
The system targets inline SVG, not images:
```css
#tags-header.section-header.header-color-context-active #new-page-btn .icon svg { ... }
```

## Semantic Color Mapping

| Action | Button(s) | Color intent |
|---|---|---|
| Create | `#new-page-btn` | Green |
| Informational | `#date-btn`, `#refresh-anchors`, `#save-bookmark` | Brand blue |
| Destructive | `#clear-color` | Red |
| History navigation | `#back-btn`, `#forward-btn` | Amber |

Notes:
- Blue is aligned with the header brand accent in current tuning.
- Red has extra contrast in dark families for readability.

## Theme Handling

### Base behavior
- Section-level mapping is defined once for all themes.

### Dark-family overrides
- Additional contrast tuning exists for:
  - `data-theme="figma-dark"`
  - `data-theme="dark"` (system-dark compatibility)
  - `data-theme="boilerplate"`

These overrides adjust filter intensity so colors do not collapse to low-contrast or white-looking results on dark backgrounds.

## Updating Colors Safely

When adjusting color appearance:
1. Edit only the filter blocks under `.header-color-context-active`.
2. Keep base mapping + dark-family overrides in sync.
3. Prefer small filter tweaks (invert/sepia/saturate/brightness/contrast).
4. Avoid broad `!important` usage unless there is a verified specificity conflict.

## Known Gotchas

Recurring pitfalls to check first when icon colors regress:

1. **Icons look white in dark themes**
   - Cause: over-aggressive `invert(1)` style chains in dark overrides.
   - Fix: tune hue-specific filters first; reserve pure inversion for intentionally white states.

2. **Header hover color does not apply**
   - Cause: selector specificity is weaker than theme/base icon rules.
   - Fix: keep section-context selectors in the `#header.section-header.header-color-context-active ... svg` form.

3. **One color family looks dim (usually red)**
   - Cause: perceptual luminance mismatch on dark backgrounds.
   - Fix: raise `saturate`, `brightness`, and `contrast` for that family in dark overrides only.

4. **System dark does not match Figma dark**
   - Cause: overrides added only for `data-theme="figma-dark"` but not `data-theme="dark"`.
   - Fix: mirror the same override block for both theme keys.

5. **Changes work in prototype but not in Figma runtime**
   - Cause: stale plugin build or old iframe instance.
   - Fix: run `npm run build`, then relaunch the plugin from `manifest.json` before validating.

## Verification Checklist

After changes:
1. Run `npm run build`.
2. Reload the plugin in Figma.
3. Verify header hover/focus icon colors in:
   - System (light + dark)
   - Figma Light
   - Figma Dark
   - Boilerplate
4. Confirm:
   - semantic color mapping is correct
   - destructive red has comparable contrast to green/blue
   - disabled nav buttons remain visually distinct

## Related References
- `src/styles.css`
- `src/ui/navigate/navigate-ui.ts`
- `.cursor/rules/icons-and-animation.mdc`
