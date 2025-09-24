# Tech Stack & Build System

## Core Technologies

- **TypeScript**: Primary language for both plugin code and UI
- **CSS Design Tokens**: Comprehensive token system for consistent theming and styling
- **esbuild**: Fast bundler for development and production builds
- **Node.js**: Build tooling and scripts
- **Figma Plugin API**: `@figma/plugin-typings` for type safety

## Key Dependencies

- **lottie-web**: Animation support for enhanced UI
- **@lemonsqueezy/lemonsqueezy.js**: Premium features and subscription management
- **ESLint**: Code linting with Figma plugin rules

## Build System

Uses a custom esbuild configuration with asset inlining and dual-target compilation:

- **Plugin Code**: Compiled to CommonJS for Figma sandbox (`dist/code.js`)
- **UI Code**: Compiled to IIFE for browser iframe (`dist/ui.js`)
- **Asset Inlining**: SVG, PNG, and Lottie JSON files are automatically inlined as data URIs
- **CSS/JS Inlining**: All external resources are bundled into a single HTML file

## Common Commands

```bash
# Development
npm run dev              # Watch mode with auto-rebuild
npm run build            # Development build
npm run build:prod       # Production build (minified)

# Plugin Distribution
npm run build:plugin-ready  # Create production-ready plugin files
npm run package             # Create distributable zip file

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # TypeScript type checking
npm run validate         # Full validation (lint + build)

# Utilities
npm run clean            # Clean dist directory
npm run clean:all        # Clean dist and plugin-ready directories
npm run info             # Show build output sizes
```

## Development Workflow

1. Use `npm run dev` for active development with file watching
2. **Always use design tokens** from `styles.css` instead of hardcoded values
3. Test changes by reloading the plugin in Figma
4. **Verify theme compatibility** across all supported themes (boilerplate, cybertron, figma-light)
5. Run `npm run validate` before committing
6. Use `npm run build:plugin-ready` for distribution builds

## Design Token Integration

- **CSS Variables**: All styling uses semantic design tokens for consistency
- **Theme Support**: Multi-theme architecture with automatic token overrides
- **Responsive Design**: Token-based responsive breakpoints and sizing
- **Accessibility**: Built-in high contrast and reduced motion support