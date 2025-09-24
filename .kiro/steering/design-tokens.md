# Design System Tokens

## Overview

Stratus Hue uses a comprehensive design token system built with CSS custom properties for consistent, maintainable, and themeable UI components. All styling should leverage these tokens rather than hardcoded values.

## Token Categories

### Spacing System
Use semantic spacing tokens for consistent layout:
```css
--spacing-xs: 2px    /* Micro spacing */
--spacing-sm: 4px    /* Small gaps */
--spacing-md: 6px    /* Default spacing */
--spacing-lg: 8px    /* Section padding */
--spacing-xl: 10px   /* Large spacing */
--spacing-xxl: 12px  /* Maximum spacing */
```

### Typography Tokens
Consistent text sizing and weights:
```css
--font-size-xs: 10px
--font-size-sm: 11px
--font-size-md: 12px  /* Base size */
--font-size-lg: 14px

--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Component Sizing
Standardized component dimensions:
```css
--button-height-sm: 16px
--button-height-md: 24px
--button-height-lg: 32px

--icon-size-xs: 6px
--icon-size-sm: 8px
--icon-size-md: 10px
--icon-size-lg: 16px
--icon-size-xl: 18px
```

### Border Radius System
Consistent corner rounding:
```css
--border-radius-xs: 2px
--border-radius-sm: 3px
--border-radius-md: 4px
--border-radius-lg: 6px
--border-radius-xl: 8px
--border-radius-pill: 999px
```

## Theme System

### Color Tokens
Use semantic color tokens that adapt to themes:
```css
/* Background Colors */
--theme-bg-primary
--theme-bg-secondary
--theme-bg-elevated
--theme-bg-hover
--theme-bg-active

/* Text Colors */
--theme-text-primary
--theme-text-secondary
--theme-text-muted
--theme-text-disabled

/* Border Colors */
--theme-border-primary
--theme-border-secondary
--theme-border-accent

/* Interactive States */
--theme-interactive-hover
--theme-interactive-active
--theme-interactive-disabled
```

### Status Colors
Consistent status indication:
```css
--theme-success: #4ade80
--theme-warning: rgba(255, 193, 7, 0.9)
--theme-error: #ff6b6b
--theme-info: rgba(111, 176, 255, 0.9)
```

## Implementation Guidelines

### DO: Use Semantic Tokens
```css
/* ✅ Good - Uses semantic tokens */
.button {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  border-radius: var(--border-radius-md);
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}
```

### DON'T: Use Hardcoded Values
```css
/* ❌ Bad - Hardcoded values */
.button {
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 4px;
  background: #2c2c2c;
  color: #ffffff;
}
```

### Responsive Design
Tokens enable easy responsive adjustments:
```css
/* Modify token values for different screen sizes */
@media (max-width: 240px) {
  :root {
    --spacing-lg: 6px;
    --font-size-md: 11px;
  }
}
```

## Theme Support

### Multi-Theme Architecture
The plugin supports multiple themes through token overrides:
- **Boilerplate**: Pure dark theme
- **Cybertron**: Futuristic neon theme
- **Figma Light**: Native Figma light integration

### Adding New Themes
Create theme-specific token overrides:
```css
[data-theme="new-theme"] {
  --theme-bg-primary: #custom-color;
  --theme-text-primary: #custom-text;
  /* Override other tokens as needed */
}
```

## Accessibility Tokens

### High Contrast Support
Tokens automatically adapt for accessibility:
```css
@media (prefers-contrast: high) {
  :root {
    --outline-width: 3px;
    --border-width: 2px;
  }
}
```

### Reduced Motion
Motion tokens respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration-fast: 0.01ms;
    --transition-duration-medium: 0.01ms;
  }
}
```

## Best Practices

1. **Always use tokens** instead of hardcoded values
2. **Use semantic naming** that describes purpose, not appearance
3. **Test across all themes** to ensure consistency
4. **Leverage calculated values** for related measurements
5. **Document custom tokens** when extending the system
6. **Consider accessibility** when defining new tokens

## Token Validation

When adding new components or styles:
1. Check if existing tokens meet your needs
2. Use semantic tokens over specific values
3. Test theme switching functionality
4. Verify accessibility compliance
5. Document any new token additions