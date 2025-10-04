# Design Document

## Overview

A single-page design system assessment tool that displays all themes in a tabular comparison format. Built as a standalone HTML page that can be opened in a browser for easy sharing and review.

## Architecture

### Core Components
- **Token Comparison Table**: Multi-column layout showing token values across themes
- **Component Preview Grid**: Live component examples with theme switching
- **Analysis Dashboard**: Usage statistics and optimization recommendations

### Data Sources
- Parse existing `src/styles.css` for token definitions
- Extract theme overrides from CSS selectors
- Scan TypeScript files for token usage patterns

## Components and Interfaces

### Token Parser
```typescript
interface TokenData {
  name: string;
  category: 'spacing' | 'typography' | 'color' | 'sizing';
  values: Record<ThemeName, string>;
  usage: string[];
}
```

### Theme Comparison View
- Three-column layout (Boilerplate | Cybertron | Figma Light)
- Color-coded differences highlighting
- Expandable categories for organization

### Component Preview
- Iframe-based component rendering
- Real-time theme switching
- State demonstration (hover, active, disabled)

## Data Models

### Design System Schema
```typescript
interface DesignSystem {
  tokens: TokenData[];
  components: ComponentDefinition[];
  themes: ThemeDefinition[];
  usage: UsageAnalysis;
}
```

## Error Handling

- Graceful fallbacks for missing token values
- Clear error messages for parsing failures
- Validation warnings for inconsistent patterns

## Testing Strategy

- Token parsing accuracy validation
- Theme switching functionality tests
- Component rendering verification across themes