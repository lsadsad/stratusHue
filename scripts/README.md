# Build Scripts

This directory contains scripts for building and packaging the stratusHue plugin.

## Scripts

### `build-plugin-ready.js`

Creates a production-ready build from the `dist/` folder.

**What it does:**
- Cleans the `plugin-ready/` directory
- Copies built files from `dist/` to `plugin-ready/`
- Copies assets to `plugin-ready/assets/`
- Generates production `manifest.json`
- Creates a distribution README

**Run via:**
```bash
npm run build:plugin-ready
```

**Dependencies:**
- Requires `dist/` folder (run `npm run build:prod` first)
- Will auto-run build if `dist/` doesn't exist

### `package-plugin.js`

Packages the `plugin-ready/` folder into a distributable zip file.

**What it does:**
- Checks if `plugin-ready/` exists (runs build if missing)
- Creates `packages/` directory
- Zips contents of `plugin-ready/`
- Names zip with version from `package.json`
- Shows package size

**Run via:**
```bash
npm run package
```

**Dependencies:**
- Requires `plugin-ready/` folder
- Will auto-run build if `plugin-ready/` doesn't exist

**Cross-platform:**
- Uses `zip` command on macOS/Linux
- Uses PowerShell `Compress-Archive` on Windows

### `add-figma-variables.ts` & `add-figma-variables-standalone.js`

Scripts for adding design system variables to Figma. See [README-FIGMA-VARIABLES.md](README-FIGMA-VARIABLES.md) for details.

## Build Pipeline

These scripts work together in a pipeline:

```
src/ → [esbuild] → dist/ → [build-plugin-ready.js] → plugin-ready/ → [package-plugin.js] → packages/*.zip
```

## Quick Reference

| Task | Command | Script Used |
|------|---------|-------------|
| Development build | `npm run build` | esbuild.config.js |
| Watch mode | `npm run dev` | esbuild.config.js |
| Production build to dist | `npm run build:prod` | esbuild.config.js |
| Create plugin-ready folder | `npm run build:plugin-ready` | build-plugin-ready.js |
| Full build + package | `npm run build:plugin-ready:zip` | Both scripts |
| Package only | `npm run package` | package-plugin.js |

## Detailed Documentation

For comprehensive information about the build process, see:
- **[../docs/BUILD_PROCESS.md](../docs/BUILD_PROCESS.md)** - Full build pipeline documentation
- **[../README.md](../README.md#-development)** - Quick start guide

## Environment Variables

### `build-plugin-ready.js`

- `AUTO_PACKAGE` - If `true`, automatically runs packaging after build
- `PLUGIN_OUTPUT_DIR` - Custom output directory for the package

**Example:**
```bash
AUTO_PACKAGE=true npm run build:plugin-ready
```

### `package-plugin.js`

- `PLUGIN_OUTPUT_DIR` - Custom output directory for the package

**Example:**
```bash
PLUGIN_OUTPUT_DIR=~/Desktop npm run package
```

## Command Line Arguments

### `build-plugin-ready.js`

- `--package` - Automatically package after building
- `--output=<path>` - Custom output directory for package

**Example:**
```bash
npm run build:plugin-ready -- --package --output=~/Desktop
```

### `package-plugin.js`

- First argument: Custom output directory

**Example:**
```bash
npm run package ~/Desktop
```

Or use the convenience script:
```bash
npm run package:desktop  # Windows only (uses %USERPROFILE%\Desktop)
```

## Output Directories

- **`dist/`** - Development build (with source maps)
- **`plugin-ready/`** - Production build (minified, no source maps)
- **`packages/`** - Zipped distribution packages

## Notes

- Both scripts are ESM modules (use `import` instead of `require`)
- Scripts will create output directories if they don't exist
- Scripts log progress and file sizes to console
- Build artifacts (`dist/`, `plugin-ready/`, `packages/`) are typically not committed to git

