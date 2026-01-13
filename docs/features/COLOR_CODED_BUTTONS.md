# Color-Coded Quick Action Buttons

## Overview
This document explains how to enable/disable color-coding for quick action button icons to represent their functionality, similar to the Controls section buttons.

## Color Scheme
The color-coding follows semantic meaning:

| Button(s) | Color | Hex/Hue | Meaning | Functionality |
|-----------|-------|---------|---------|---------------|
| **New Page** | 🟢 Green | hue-rotate(85deg) | Creation/Additive | Creates new content |
| **Go Back/Forward** | 🔵 Blue | hue-rotate(190deg) | Navigation/History | Moves through navigation history |
| **Settings** | ⚫ Gray/Neutral | saturate(0%) | Utility | Configuration and preferences |
| **Remove Tag** | 🟡 Orange/Yellow | hue-rotate(15deg) | Warning | Removes data (non-destructive) |
| **Add Date** | 🔵 Cyan | hue-rotate(190deg) | Informational | Adds metadata |
| **Save/Refresh Bookmark** | 🔵 Cyan | hue-rotate(190deg) | Informational | Saves/syncs location |
| **Indent/Outdent** | 🟣 Purple | hue-rotate(240deg) | Organization | Hierarchy adjustments |
| **Delete** | 🔴 Red | hue-rotate(330deg) | Destructive | Permanently removes content |

## Implementation Location
The color-coded button rules are located in `src/styles.css` at approximately **line 6090** (after the Cybertron theme hover/active states).

Look for this comment:
```css
/* ===== COLOR-CODED QUICK ACTION BUTTONS ===== */
/* IMPORTANT: These rules must come AFTER the theme-specific icon rules above to override them */
```

## Enabling Color-Coding

### Method 1: Remove Comment Blocks
The color-coded rules are currently active but can be disabled by wrapping them in CSS comments:

```css
/* DISABLED: Color-coded quick action buttons
[all the color-coded button rules here]
*/
```

### Method 2: Remove !important Flags
If the colors aren't showing, the `!important` flags may have been removed. Add them back:

```css
#new-page-btn .icon img {
  filter: brightness(0) saturate(100%) invert(45%) sepia(80%) saturate(500%) hue-rotate(85deg) brightness(0.85) !important;
}
```

## Disabling Color-Coding (Reverting to White/Monochrome)

### Option 1: Comment Out the Entire Section
Wrap the entire color-coded section (from line ~6090 to ~6540) in CSS comments:

```css
/*
[entire color-coded section here]
*/
```

### Option 2: Remove !important Flags
Remove the `!important` flags from all color-coded rules. This will allow the theme-specific monochrome rules to take precedence.

### Option 3: Delete the Section
Delete all rules between these two comments:
- Start: `/* ===== COLOR-CODED QUICK ACTION BUTTONS ===== */`
- End: `#quick-actions #refresh-anchors:hover {` (the line before this)

## Customizing Colors

### Understanding CSS Filter Functions
The color filters use a combination of CSS filter functions:
- `brightness(0)` - Makes the icon black
- `saturate(100%)` - Full saturation
- `invert(X%)` - Inverts colors (0% = black, 100% = white)
- `sepia(X%)` - Applies sepia tone (0-100%)
- `hue-rotate(Xdeg)` - Rotates the color hue
- `brightness(X)` - Final brightness adjustment

### Color Formula Pattern
```css
/* Default state (medium saturation) */
filter: brightness(0) saturate(100%) invert(45%) sepia(80%) saturate(500%) hue-rotate(XXXdeg) brightness(0.85);

/* Hover state (darker/more saturated) */
filter: brightness(0) saturate(100%) invert(35%) sepia(90%) saturate(600%) hue-rotate(XXXdeg) brightness(0.7);

/* Active state (white) */
filter: brightness(0) invert(1);
```

### Changing a Button's Color
To change a button to a different color, modify the `hue-rotate()` value:
- **Red**: `hue-rotate(330deg)`
- **Orange**: `hue-rotate(15deg)`
- **Yellow**: `hue-rotate(45deg)`
- **Green**: `hue-rotate(85deg)`
- **Cyan**: `hue-rotate(190deg)`
- **Blue**: `hue-rotate(210deg)`
- **Purple**: `hue-rotate(240deg)`
- **Magenta**: `hue-rotate(300deg)`

### Example: Changing New Page Button from Green to Blue
```css
/* Original (Green) */
#new-page-btn .icon img {
  filter: brightness(0) saturate(100%) invert(45%) sepia(80%) saturate(500%) hue-rotate(85deg) brightness(0.85) !important;
}

/* Changed to Blue */
#new-page-btn .icon img {
  filter: brightness(0) saturate(100%) invert(45%) sepia(80%) saturate(500%) hue-rotate(210deg) brightness(0.85) !important;
}
```

## Theme-Specific Adjustments

### Light Themes (figma-light, light)
Use darker colors with lower brightness values:
```css
[data-theme="figma-light"] #new-page-btn .icon img {
  filter: brightness(0) saturate(100%) invert(35%) sepia(85%) saturate(550%) hue-rotate(85deg) brightness(0.75) !important;
}
```

### Dark Themes (figma-dark, boilerplate, cybertron)
Use brighter, inverted colors:
```css
[data-theme="cybertron"] #new-page-btn .icon img {
  filter: brightness(0) invert(1) sepia(100%) saturate(400%) hue-rotate(70deg) brightness(1.1) !important;
  opacity: 0.9 !important;
}
```

## Button ID Reference
Quick reference for all color-coded buttons:

```css
/* Navigation */
#back-btn
#forward-btn
#new-page-btn

/* Settings */
#settings-btn

/* Tags */
#clear-color

/* Metadata */
#date-btn
#save-bookmark
#refresh-anchors

/* Organization */
#indent-title-btn
#outdent-title-btn

/* Destructive */
#nav-delete
```

## Why This Was Needed
The color-coded rules must come AFTER the theme-specific icon rules because:
1. CSS cascade applies rules in order
2. Theme rules at lines 5948-6088 set all icons to monochrome
3. Without `!important`, those theme rules override the color-coded rules
4. By placing color rules AFTER theme rules + using `!important`, they take precedence

## Testing
After making changes:
1. Run `npm run build` to rebuild the plugin
2. Reload the plugin in Figma
3. Test all themes: System, Light, Dark, Boilerplate, Cybertron
4. Verify hover and active states work correctly
5. Check disabled states maintain proper opacity

## Related Files
- `src/styles.css` - Main stylesheet with color-coded rules
- `src/ui.html` - HTML structure with button IDs
- `docs/features/CURRENT_PLUGIN_STRUCTURE_ANALYSIS.md` - Overall plugin structure
