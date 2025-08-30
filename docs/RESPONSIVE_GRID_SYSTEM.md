# Responsive Grid System for Emoji Buttons

## Overview

The emoji-buttons grid containers now adapt to changes in width using a responsive CSS Grid system. This ensures optimal layout and usability across different Figma plugin panel sizes.

## Breakpoints

The responsive system uses the following breakpoints:

| Width Range | Columns | Button Size | Gap | Use Case |
|-------------|---------|-------------|-----|----------|
| < 200px | 2 | Medium | Small | Very narrow panels |
| 200px - 279px | 3 | Medium | Small | Small panels |
| 280px - 359px | 4 | Large | Small | Standard panels |
| 360px - 439px | 5 | Large | Medium | Wide panels |
| 440px+ | 6 | Large | Medium | Very wide panels |

## Implementation Details

### CSS Variables
```css
/* Responsive Grid Breakpoints */
--breakpoint-narrow: 200px;
--breakpoint-medium: 280px;
--breakpoint-wide: 360px;
```

### Media Queries
The system uses `min-width` and `max-width` media queries to create smooth transitions between different grid layouts:

```css
/* Narrow width - 2 columns for very small panels */
@media (max-width: 199px) {
  .color-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-gap: var(--spacing-xs);
  }
}

/* Medium width - 3 columns for small panels */
@media (min-width: 200px) and (max-width: 279px) {
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-gap: var(--spacing-sm);
  }
}

/* Standard width - 4 columns (default) */
@media (min-width: 280px) and (max-width: 359px) {
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-gap: var(--spacing-sm);
  }
}

/* Wide width - 5 columns for larger panels */
@media (min-width: 360px) and (max-width: 439px) {
  .color-grid {
    grid-template-columns: repeat(5, 1fr);
    grid-gap: var(--spacing-md);
  }
}

/* Extra wide - 6 columns for very large panels */
@media (min-width: 440px) {
  .color-grid {
    grid-template-columns: repeat(6, 1fr);
    grid-gap: var(--spacing-md);
  }
}
```

### Smooth Transitions

The grid system includes smooth transitions for:
- Grid template columns changes
- Grid gap adjustments
- Button size changes
- Container padding adjustments

```css
.color-grid {
  transition: grid-template-columns var(--transition-normal), 
              grid-gap var(--transition-normal);
}

.emoji-button {
  transition: all var(--transition-normal), 
              font-size var(--transition-normal), 
              height var(--transition-normal);
}

.color-grid-container {
  transition: padding var(--transition-normal);
}
```

### Accessibility Support

The responsive system respects user preferences:

- **Reduced Motion**: Transitions are disabled for users with `prefers-reduced-motion: reduce`
- **High Contrast**: Maintains focus indicators and contrast ratios
- **Touch Targets**: Ensures minimum 44px touch targets on touch devices

## Benefits

1. **Optimal Space Usage**: Grid adapts to available width, maximizing emoji button visibility
2. **Consistent UX**: Maintains usability across different panel sizes
3. **Smooth Transitions**: Visual feedback when resizing panels
4. **Accessibility**: Respects user preferences and maintains accessibility standards
5. **Performance**: Uses CSS Grid for efficient layout calculations

## Testing

To test the responsive grid system:

1. Open the Figma plugin
2. Resize the plugin panel width
3. Observe how the emoji grid adapts:
   - Very narrow: 2 columns
   - Narrow: 3 columns  
   - Standard: 4 columns
   - Wide: 5 columns
   - Very wide: 6 columns

The transitions should be smooth and the layout should remain functional at all sizes.
