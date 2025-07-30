# StrateHue

A powerful Figma plugin for strategic color coding and intelligent bookmarking of design elements. StrateHue helps designers organize their work with visual color indicators and quick navigation tools.

## ✨ Features

### 🎨 Smart Color Coding
- **Layer & Page Emoji Support**: Add color emojis to both individual layers and entire pages
- **Context-Aware Selection**: Automatically switches between square emojis (🟥🟧🟨🟩🟦🟪⬛⬜) for layers and circle emojis (🔴🟠🟡🟢🔵🟣⚫️⚪️) for pages
- **Intelligent Replacement**: Automatically replaces existing color emojis while preserving position
- **Visual Mode Indicator**: Shows "(Layer)" or "(Page)" to indicate current mode
- **Smart Detection**: Automatically detects whether you're working with layers or pages based on selection

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
2. Search for "StrateHue" and click **Install**
3. Or install manually by copying the plugin files to your Figma plugins directory

### Basic Usage

#### Adding Color Codes
1. **For Layers**: Select one or more layers - the plugin will show square emojis (🟥🟧🟨🟩🟦🟪⬛⬜) and display "(Layer)" indicator
2. **For Pages**: Deselect all layers - the plugin will show circle emojis (🔴🟠🟡🟢🔵🟣⚫️⚪️) and display "(Page)" indicator
3. **Automatic Switching**: The emoji set and indicator automatically update based on your current selection
4. **Clear Colors**: Use the "Clear Color" button to remove emojis from selected elements

#### Creating Bookmarks
1. Select any layer you want to bookmark
2. Click the **"⚓ Drop Anchor"** button
3. Your bookmark will appear in the scrollable list below

#### Navigating with Bookmarks
1. Click on any bookmark in the list to jump directly to that element
2. The plugin will automatically switch to the correct page and select the element
3. Use the **"x"** button to remove bookmarks you no longer need

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

### Development Workflow
1. Open the project in Visual Studio Code
2. Run `npm run build` to compile TypeScript to JavaScript
3. Use `npm run watch` for automatic compilation on file changes
4. Test your changes in Figma by reloading the plugin

## 📁 Project Structure

```
StrateHue/
├── code.ts          # Main plugin logic (TypeScript)
├── ui.html          # Plugin interface (HTML/CSS/JS)
├── manifest.json    # Plugin configuration
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## 🎨 Design Philosophy

StrateHue is designed with the modern designer in mind:
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
