# Sticky Section Headers

**Date:** 2026-03-27
**Mode:** Navigate
**Status:** Approved design

## Summary

Make the three Navigate section headers (Tags, Anchors, Controls) sticky within the `#navigate-main` scroll container. Headers stack at the top as the user scrolls, keeping section titles and action buttons always accessible.

## Behavior

- All three headers use `position: sticky` regardless of collapsed/expanded state
- Headers stack in DOM order: Tags at top, Anchors below it, Controls below that
- No visual change when stuck — stickiness is self-evident
- Action buttons on headers remain interactive at all times
- Collapsed sections still have their header pinned

## Implementation

### Approach: Pure CSS

No JavaScript changes needed. The sticky behavior is achieved entirely with CSS `position: sticky` and calculated `top` offsets.

### Touch Points

| File | Change |
|---|---|
| `src/styles.css` | Add `position: sticky`, `top`, `z-index`, `background` to `.section-header`; fix `contain` on `.scrollable-content`; fix `transition: all` on `.section-header` |

### Measurements

Each section header has a total height of **41px**:
- `height: calc(var(--spacing-lg) * 5)` = 40px
- `border-top: var(--border-width) solid ...` = 1px (default theme; 2px in high-contrast)

### CSS Changes

**1. Fix `.scrollable-content` containment (prerequisite)**

`.scrollable-content` currently has `contain: layout style paint` which breaks `position: sticky` by creating a new containing block. Change to:

```css
.scrollable-content {
  contain: style;  /* was: layout style paint — layout and paint break sticky */
}
```

**2. Fix `.section-header` transition**

`.section-header` currently has `transition: all var(--transition-normal)` which would animate `top` during scroll, causing jitter. Replace with explicit properties:

```css
.section-header {
  transition: background var(--transition-normal), color var(--transition-normal);
}
```

**3. Sticky positioning**

Replaces existing `position: relative` on `.section-header` (line ~2504). Children relying on the header as a positioned parent still work because `sticky` also establishes a containing block.

```css
.section-header {
  position: sticky;
  background: var(--color-background-main);  /* prevent content showing through */
}

/* Stacking offsets — each header's top = sum of heights above it */
#tags-header {
  top: 0;
  z-index: 3;
}

#anchors-header {
  top: calc(var(--spacing-lg) * 5 + var(--border-width));  /* 41px */
  z-index: 2;
}

#controls-header {
  top: calc((var(--spacing-lg) * 5 + var(--border-width)) * 2);  /* 82px */
  z-index: 1;
}
```

### Design Notes

- **Background required:** Sticky headers must have an opaque background so scrolling content doesn't show through. Uses `var(--color-background-main)` to match the theme.
- **z-index descending:** Tags (3) > Anchors (2) > Controls (1) so upper headers visually layer over lower ones during scroll.
- **Uses custom properties for offsets:** If header height changes, the sticky offsets update automatically. The `var(--border-width)` accounts for the 1px/2px border in standard/high-contrast themes.
- **No impact on collapse animation:** The `.collapsed` class targets `.collapsible-content`, not the header. Sticky headers and collapse are independent.
- **High-contrast theme:** `--border-width` becomes 2px, making each header 42px. The `calc()` expressions handle this automatically.
- **Replaces `position: relative`:** `.section-header` currently uses `position: relative`. `sticky` also creates a containing block, so positioned children are unaffected.
- **`contain` fix required:** `.scrollable-content` has `contain: layout style paint` which creates a new containing block and breaks sticky. Must be reduced to `contain: style`.
- **All-collapsed edge case:** When all three sections are collapsed, the three sticky headers consume ~123px of vertical space. Accepted — this is the intended behavior since headers carry action buttons.

## Decisions

- **Always sticky:** Headers stick regardless of expanded/collapsed state — action buttons should always be reachable
- **No stuck indicator:** No shadow or visual change when pinned
- **CSS only:** No JS changes required
