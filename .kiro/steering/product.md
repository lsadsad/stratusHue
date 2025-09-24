# Product Overview

**Stratus Hue** is a Figma plugin for strategic color coding and intelligent bookmarking of design elements. It helps designers organize their work with visual color indicators and smart tagging tools.

## Core Features

- **Smart Color Coding**: Add color emojis to layers (🟥🟧🟨🟩🟦🟪⬛⬜) and pages (🔴🟠🟡🟢🔵🟣⚫️⚪️)
- **Date Tagging**: Add today's date to layer names or page titles with auto-replacement
- **Intelligent Bookmarking**: Save and navigate to important design elements across pages
- **Layer Navigation**: Traverse layer hierarchy with Up/Down/Enter/Exit controls
- **Page Title Builder**: Canonical page titles with consistent token order: `↳ [emoji] [MM.DD] : Title`

## Target Users

Figma designers who need to organize complex design files with visual indicators and quick navigation between important elements.

## Plugin Architecture

- Dual-context architecture: sandbox code (`code.ts`) + UI iframe (`ui.ts`)
- **Design token system**: Comprehensive CSS custom properties for consistent theming
- **Multi-theme support**: Boilerplate (dark), Cybertron (neon), and Figma Light themes
- Premium features integration via Lemon Squeezy
- Lottie animation support for enhanced UI
- State persistence across plugin sessions