---
id: hdr
category: navigate
title: "BUG — Header action icons don't light up on header hover"
type: bug
priority: 1
status: closed
depends_on: []
created: 2026-03-28
---

# Header action icons don't light up on header hover

## Resolution (2026-03-28)

Root cause was twofold: (1) color-coded quick-action rules used `!important` on `#new-page-btn` / `#date-btn` / etc., which overrode `#tags-header:hover …` despite lower ID count; (2) `[data-theme] #tags-header #btn` tied or beat `#tags-header:hover #btn` on specificity and won by source order.

Fix: dropped `!important` from those header-only button rules (kept for `#settings-btn` and `#nav-delete`), split `nav-delete` into its own themed blocks, and tightened bar-hover selectors to `#tags-header.section-header:hover …` so specificity clears theme defaults.

## Goal

When hovering a section header bar (Tags, Anchors, Controls), the action button icons (new page, date, remove tag, bookmark, nav arrows) should transition from muted monochrome to brand blue — matching the title text and chevron behavior.

## Current state

- Title text turns brand blue on hover ✓
- Chevron becomes visible on hover ✓
- Action icons remain muted/unchanged on hover ✗

## What's been tried

### 1. Class-level selector (failed — specificity)
```css
.section-header:hover .header-action-btn .icon svg { ... }
```
Lost to `#tags-header #new-page-btn .icon svg` (ID specificity 0,2,1,1 > class 0,0,4,1).

### 2. ID-level selector (failed — source order)
```css
#tags-header:hover #new-page-btn .icon svg { ... }
```
Equal specificity to default rule, but default appeared later in file.

### 3. Moved after default rules (failed — filter ineffective)
Correct specificity and source order, but the filter produces barely visible tint. The SVGs use `stroke="white"` (hardcoded), not `stroke="currentColor"`.

### 4. Stronger filter (failed — still no visible change)
```css
filter: brightness(0) saturate(100%) invert(52%) sepia(98%) saturate(1200%) hue-rotate(190deg) brightness(1.05);
```
Rule is in the build output (`dist/ui.html`) — verified with grep. But no visible change in Figma runtime.

## Key files

| File | Lines | What |
|---|---|---|
| `src/styles.css:3497-3506` | Default monochrome rule | `#tags-header #new-page-btn .icon svg { filter: brightness(0) saturate(0%); opacity: 0.7; }` |
| `src/styles.css:3508-3517` | Hover rule (our addition) | `#tags-header:hover #new-page-btn .icon svg { ... }` |
| `src/styles.css:2673-2684` | Individual button hover | `.header-action-btn:hover .icon svg { ... }` — this DOES work |
| `dist/ui.html:7994` | Built SVG structure | `<span class="icon"><svg ...><path stroke="white" .../></svg></span>` |

## Debugging approach for Cursor

1. **Verify the rule is being applied** — In Figma, open DevTools on the plugin iframe. Inspect a header action button's SVG. Check Computed styles for `filter` when hovering the parent `#tags-header`. Look for whether the hover rule appears in the matched rules list.

2. **Check for overrides** — There may be a more specific rule or `!important` declaration overriding the hover. The `[data-theme=...]` selectors in the light/dark theme blocks could win if they set filter on these elements.

3. **Test isolation** — Try adding `!important` to the hover filter temporarily to rule out specificity entirely. If that works, it's a specificity problem. If not, the hover pseudo-class on the header might not be propagating to descendant selectors in Figma's iframe.

4. **Check if `:hover` propagates** — Figma's iframe may not propagate `:hover` from a parent `<header>` to its deeply nested `<svg>` descendants via CSS selectors like `#parent:hover #child .icon svg`. Test with a simpler rule: `#tags-header:hover { border: 2px solid red !important; }` to confirm `:hover` on the header works at all.

5. **Alternative approach if CSS hover propagation fails** — Use JavaScript: add `mouseenter`/`mouseleave` listeners on each header that toggle a class (e.g., `.header-hovered`) directly on the action buttons. Then style with `.header-action-btn.header-hovered .icon svg { ... }`.

## SVG structure (from built output)

```html
<button id="new-page-btn" class="action-btn header-action-btn" ...>
  <span class="icon">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path stroke="white" stroke-width="1.25" .../>
    </svg>
  </span>
</button>
```

Icons use `stroke="white"`, `fill="none"`. CSS `filter` is the only way to recolor them (no `currentColor` to inherit).

## Header action buttons inventory

| Header | Button ID | Icon |
|---|---|---|
| Tags | `#new-page-btn` | Add page |
| Tags | `#date-btn` | Add date |
| Tags | `#clear-color` | Remove tag |
| Anchors | `#refresh-anchors` | Sync (hidden) |
| Anchors | `#save-bookmark` | Save bookmark |
| Controls | `.header-nav-btn` (×2) | Back / Forward |

## Related working behavior

The **individual button hover** works correctly:
```css
.header-action-btn:hover .icon svg {
  filter: brightness(0) saturate(100%) invert(59%) sepia(9%) ...;
  opacity: 1;
}
```

This confirms: filter-based recoloring works, SVG structure is correct, the icons CAN change color. The problem is specifically with the **parent header hover propagation** to descendant SVGs.
