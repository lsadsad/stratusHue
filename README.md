# stratusHue

A powerful Figma plugin for strategic color coding and intelligent bookmarking of design elements. stratusHue helps designers organize their work with visual color indicators and smart tagging tools.

## ✨ Features

### 🎨 Smart Color Coding
- **Layer & Page Emoji Support**: Add color emojis to both individual layers and entire pages
- **Context-Aware Selection**: Automatically switches between square emojis (🟥🟧🟨🟩🟦🟪⬛⬜) for layers and circle emojis (🔴🟠🟡🟢🔵🟣⚫️⚪️) for pages
- **Intelligent Replacement**: Automatically replaces existing color emojis while preserving position
- **Visual Mode Indicator**: Shows "(Layer)" or "(Page)" to indicate current mode
- **Smart Detection**: Automatically detects whether you're working with layers or pages based on selection

### 🗓️ Date Tagging (New)
- **One-Click Date**: Add today's date to selected layer names or the current page title
- **Auto-Replacement**: Detects and replaces existing dates to keep things current
- **Consistent Format**: Uses a clear, consistent pattern (e.g., `↳ 🔵 08.05 : Title` for pages)



### 🔄 Resync Anchors (New)
- **Refresh Bookmarks**: Pulls the latest layer names and page names into the Anchors list
- **Auto-Update**: Bookmarks stay in sync when titles, emojis, or dates change

### 🧱 Smart Page Title Builder (New)
- **Canonical Titles**: Builds page titles with a consistent token order: `↳ [emoji] [MM.DD] : Title`
- **Normalization**: Cleans up invisible characters and spacing so titles remain uniform

### 📍 Intelligent Bookmarking
- **One-Click Bookmarks**: Save important design elements with a single click
- **Page Context**: Each bookmark shows which page it's located on
- **Smart Navigation**: Jump directly to bookmarked elements across pages
- **Visual Organization**: Clean, scrollable list with hover effects

### 🎯 User Experience
- **Collapsible Interface**: Clean, organized UI with expandable sections
- **Dark Mode Design**: Modern dark theme with cobalt blue accents
- **Responsive Layout**: Optimized for the Figma plugin window
- **Smart Truncation**: Intelligent text handling for long names and titles

## 🚀 Getting Started

### Installation
1. Open Figma and go to **Plugins > Browse plugins in Community**
2. Search for "stratusHue" and click **Install**
3. Or install manually by copying the plugin files to your Figma plugins directory

### Basic Usage

#### Adding Color Codes
1. **For Layers**: Select one or more layers - the plugin will show square emojis (🟥🟧🟨🟩🟦🟪⬛⬜) and display "(Layer)" indicator
2. **For Pages**: Deselect all layers - the plugin will show circle emojis (🔴🟠🟡🟢🔵🟣⚫️⚪️) and display "(Page)" indicator
3. **Automatic Switching**: The emoji set and indicator automatically update based on your current selection
4. **Clear Colors**: Use the "Clear Color" button to remove emojis from selected elements

#### Adding Dates
1. Click **"Date ++"** to add today's date
2. With a selection: dates are added to layer names (existing dates are replaced)
3. With no selection: the current page title is updated using the canonical format

#### Creating Bookmarks
1. Select any layer you want to bookmark
2. Click the **"⚓ Drop Anchor"** button
3. Your bookmark will appear in the scrollable list below

#### Navigating with Bookmarks
1. Click on any bookmark in the list to jump directly to that element
2. The plugin will automatically switch to the correct page and select the element
3. Use the **"x"** button to remove bookmarks you no longer need

#### Layer Navigation & Collapse
1. Use **Up / Down / Enter / Exit** to traverse layers and containers
2. Use **Collapse** or **Collapse Folders** to tidy the layer panel
3. Use **Deselect** to clear your current selection

#### Resyncing Anchors
1. Click **"Resync"** to refresh anchor names and page locations
2. Helpful after manual renaming or page title updates

## 🛠 Development

This plugin is built with TypeScript and uses modern web technologies for optimal performance.

### Prerequisites
- Node.js (download from https://nodejs.org/en/download/)
- TypeScript: `npm install -g typescript`

### Setup
1. Clone this repository
2. Install dependencies: `npm install`
3. Install Figma plugin typings: `npm install --save-dev @figma/plugin-typings`
4. Build the project: `npm run build`

### Quick Start

**For development:**
```bash
npm run dev  # Watch mode - automatically rebuilds on file changes
```

**For distribution:**
```bash
npm run build:plugin-ready:zip  # Full production build + package
```

### Development Workflow
1. Open the project in Visual Studio Code
2. Run `npm run dev` for automatic compilation on file changes
3. In Figma: Plugins → Development → Import plugin from `manifest.json`
4. Test your changes (reload plugin in Figma after rebuilds)

### Production Build
1. Run `npm run build:plugin-ready:zip` to create the full distributable package
2. The `plugin-ready/` folder contains production-ready files
3. The `packages/` folder contains the zipped package for distribution

> **📖 Detailed Build Documentation:** See [docs/BUILD_PROCESS.md](docs/BUILD_PROCESS.md) for comprehensive information about the build pipeline, troubleshooting, and best practices.

## 📁 Project Structure

```
stratusHue/
├── src/
│   ├── code.ts          # Main plugin logic (TypeScript)
│   ├── core.ts          # Core functionality (bookmarks, navigation, etc.)
│   ├── types.ts         # TypeScript type definitions
│   ├── constants.ts     # Plugin constants and configuration
│   ├── utils.ts         # Utility functions
│   ├── styles.css       # Consolidated stylesheet
│   └── ui.html          # Plugin interface (HTML/CSS/JS)
├── scripts/
│   ├── build-plugin-ready.js  # Production build script
│   └── package-plugin.js      # Distribution packaging script
├── dist/                # Development build output
├── plugin-ready/        # Production-ready distribution files
├── packages/            # Packaged plugin zip files
├── manifest.json        # Plugin configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 🎨 Design Philosophy

stratusHue is designed with the modern designer in mind:
- **Minimalist Interface**: Clean, distraction-free UI
- **Intuitive Workflow**: Actions that feel natural and efficient
- **Visual Hierarchy**: Clear organization with proper spacing and typography
- **Responsive Feedback**: Immediate visual feedback for all interactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ for the Figma community**
