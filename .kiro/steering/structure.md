# Project Structure & Organization

## Root Directory Layout

```
├── src/                 # Source code (TypeScript)
├── dist/                # Development build output
├── plugin-ready/        # Production-ready distribution files
├── assets/              # Static assets (SVG, PNG, Lottie JSON)
├── scripts/             # Build and packaging scripts
├── docs/                # Documentation and guides
├── packages/            # Packaged plugin zip files
└── .kiro/               # Kiro IDE configuration
```

## Source Code Architecture (`src/`)

### Core Plugin Files
- **`code.ts`**: Main plugin logic running in Figma sandbox
- **`ui.ts`**: UI logic running in browser iframe
- **`ui.html`**: Plugin interface markup
- **`styles.css`**: Consolidated stylesheet with comprehensive design token system

### Modular Components
- **`types.ts`**: Centralized TypeScript type definitions
- **`constants.ts`**: Plugin constants and configuration
- **`state.ts`**: State management and persistence
- **`utils.ts`**: Shared utility functions
- **`validation.ts`**: Input validation and error handling
- **`error-handling.ts`**: Error management utilities

### Feature Modules
- **`bookmarks.ts`**: Bookmark management and validation
- **`navigation.ts`**: Layer and page navigation logic
- **`emoji-manager.ts`**: Color emoji handling for layers/pages
- **`ui-communication.ts`**: Message passing between sandbox and UI
- **`lemon-squeezy.ts`**: Premium features integration
- **`lemon-squeezy-config.ts`**: Payment service configuration

## Build Output Structure

### Development (`dist/`)
- `code.js` - Plugin sandbox code (CommonJS)
- `ui.js` - UI code (IIFE)
- `ui.html` - Complete UI with inlined CSS/JS/assets
- `assets/` - Static assets (copied from source)

### Production (`plugin-ready/`)
- Optimized, minified versions of dist files
- Ready for Figma plugin submission

## Configuration Files

- **`manifest.json`**: Figma plugin configuration
- **`package.json`**: Dependencies and npm scripts
- **`tsconfig.json`**: TypeScript config for plugin code
- **`tsconfig.ui.json`**: TypeScript config for UI code
- **`esbuild.config.js`**: Custom build configuration

## Architectural Patterns

### Dual-Context Design
- **Sandbox Context**: `code.ts` handles Figma API interactions
- **UI Context**: `ui.ts` handles user interface and interactions
- **Message Passing**: Structured communication via `postMessage`

### Modular Organization
- Feature-based modules with clear separation of concerns
- Centralized type definitions and constants
- Shared utilities for common operations
- State management isolated from business logic

### Asset Management
- Static assets automatically inlined during build
- Lottie animations embedded as data URIs
- SVG icons and images bundled into single HTML file

### Design System Architecture
- **Token-Based Styling**: All CSS uses semantic design tokens for consistency
- **Multi-Theme Support**: Theme-specific token overrides for different visual styles
- **Responsive Design**: Token-driven responsive breakpoints and component sizing
- **Accessibility Integration**: Built-in support for high contrast and reduced motion preferences