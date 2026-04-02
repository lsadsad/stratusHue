# Build Process Documentation

This document explains the stratusHue plugin's build pipeline, folder structure, and when to use each build command.

## 📦 Build Pipeline Overview

The plugin uses a **3-stage build pipeline**:

```
┌─────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  src/   │ --> │  dist/   │ --> │ plugin-ready/│ --> │  packages/   │
│ Source  │     │   Dev    │     │  Production  │     │     Zip      │
└─────────┘     └──────────┘     └──────────────┘     └──────────────┘
   TypeScript      JavaScript        Optimized          Distribution
   + CSS          + Inlined CSS      Production         Ready Package
   + HTML         + Source maps      No source maps
```

### Stage 1: `src/` → `dist/` (Development Build)

**What happens:**
- TypeScript files are compiled to JavaScript
- CSS is inlined into HTML
- UI JavaScript is bundled and inlined into HTML
- Assets are copied to `dist/assets/`
- Source maps are generated for debugging
- **NOT minified** (readable code)

**Output:**
- `dist/code.js` - Plugin logic with source maps
- `dist/ui.html` - Plugin UI with inlined CSS/JS
- `dist/ui.js` - Bundled UI code (gets inlined into HTML)
- `dist/assets/` - Copy of all assets

**Use for:** Development and testing in Figma

### Stage 2: `dist/` → `plugin-ready/` (Production Build)

**What happens:**
- Production build is created (minified, no source maps)
- Files are copied from `dist/` to `plugin-ready/`
- Production `manifest.json` is generated
- Plugin is ready for distribution or testing

**Output:**
- `plugin-ready/code.js` - Minified plugin logic (~68 KB)
- `plugin-ready/ui.html` - Production UI (~257 KB)
- `plugin-ready/manifest.json` - Clean manifest
- `plugin-ready/assets/` - All required assets
- `plugin-ready/icon.svg` - Plugin icon

**Use for:** Pre-distribution testing, manual installation

### Stage 3: `plugin-ready/` → `packages/` (Package/Zip)

**What happens:**
- `plugin-ready/` folder is compressed into a zip file
- Zip is named with version from `package.json`
- Ready for Figma Community submission or distribution

**Output:**
- `packages/stratushue-plugin-v1.0.0.zip` (~94 KB)

**Use for:** Distribution, sharing, Figma Community submission

## 🛠️ Build Commands

### Development Commands

#### `npm run build`
```bash
npm run build
```
- **Updates:** `dist/` only
- **Environment:** Development
- **Minification:** No
- **Source maps:** Yes
- **Use when:** Testing changes during development

#### `npm run dev`
```bash
npm run dev
```
- **Updates:** `dist/` only
- **Environment:** Development (watch mode)
- **Minification:** No
- **Source maps:** Yes
- **Auto-rebuild:** Yes (watches for file changes)
- **Use when:** Actively developing and testing

### Production Commands

#### `npm run build:prod`
```bash
npm run build:prod
```
- **Updates:** `dist/` only
- **Environment:** Production
- **Minification:** Yes
- **Source maps:** No
- **Use when:** Creating a production build to `dist/`

#### `npm run build:plugin-ready`
```bash
npm run build:plugin-ready
```
- **Updates:** `dist/` → `plugin-ready/`
- **Environment:** Production
- **Minification:** Yes
- **Source maps:** No
- **Use when:** Preparing files for distribution testing

#### `npm run build:plugin-ready:zip` ⭐ **Recommended**
```bash
npm run build:plugin-ready:zip
```
- **Updates:** `dist/` → `plugin-ready/` → `packages/*.zip`
- **Environment:** Production
- **Minification:** Yes
- **Source maps:** No
- **Full pipeline:** Yes
- **Use when:** Creating final distributable package

#### `npm run package`
```bash
npm run package
```
- **Updates:** `packages/*.zip` only
- **Requires:** `plugin-ready/` folder must exist
- **Use when:** Re-packaging existing `plugin-ready/` build

### Utility Commands

#### `npm run clean`
```bash
npm run clean
```
Removes `dist/` directory

#### `npm run clean:all`
```bash
npm run clean:all
```
Removes both `dist/` and `plugin-ready/` directories

## 🚨 Common Issues

### Issue: Packaged plugin doesn't match dev build

**Cause:** You only ran `npm run build` or `npm run dev`, which updates `dist/` but not `plugin-ready/`.

**Solution:**
```bash
npm run build:plugin-ready:zip
```

This runs the full pipeline and ensures all folders are in sync.

### Issue: Changes not appearing in Figma

**For development (using `dist/`):**
1. Make sure you ran `npm run build` or have `npm run dev` running
2. In Figma: Right-click plugin → "Restart plugin"

**For packaged version (using `plugin-ready/`):**
1. Run `npm run build:plugin-ready`
2. In Figma: Uninstall and reinstall the plugin from the `plugin-ready/` folder

### Issue: Old assets showing in package

**Cause:** Asset changes in `src/` or `assets/` haven't been propagated through the full pipeline.

**Solution:**
```bash
npm run build:plugin-ready:zip
```

## 📁 Folder Purposes

### `src/`
- **Purpose:** Source code (TypeScript, HTML, CSS)
- **Edit:** Yes - this is where you make changes
- **Commit:** Yes - track in git
- **When modified:** Run build command to update `dist/`

### `dist/`
- **Purpose:** Development build output
- **Edit:** No - auto-generated
- **Commit:** Generally no (build artifacts)
- **Load in Figma:** Yes (for development)
- **Contains:** Readable code, source maps

### `plugin-ready/`
- **Purpose:** Production-ready distribution files
- **Edit:** No - auto-generated
- **Commit:** Optional (some teams commit for releases)
- **Load in Figma:** Yes (for pre-release testing)
- **Contains:** Minified code, no source maps

### `packages/`
- **Purpose:** Zipped distribution packages
- **Edit:** No - auto-generated
- **Commit:** Optional (or use GitHub releases)
- **Contains:** Compressed zip files ready for distribution

### `assets/`
- **Purpose:** Static assets (SVG icons, images, JSON files)
- **Edit:** Yes - source assets
- **Commit:** Yes - track in git
- **Copied to:** `dist/assets/` and `plugin-ready/assets/`

## 🔄 Recommended Workflows

### Active Development
```bash
# Terminal 1: Start watch mode
npm run dev

# Make changes to src/ files
# Plugin auto-rebuilds to dist/
# Reload plugin in Figma to see changes
```

### Pre-Release Testing
```bash
# Create production build
npm run build:plugin-ready

# Test plugin-ready/ version in Figma
# If issues found, fix in src/ and repeat
```

### Creating Distribution Package
```bash
# Full pipeline in one command
npm run build:plugin-ready:zip

# Upload packages/stratushue-plugin-v1.0.0.zip
```

### Quick Package (when plugin-ready/ is already built)
```bash
# Only re-zip existing plugin-ready/ folder
npm run package
```

## 🎯 Which Build to Use?

| Scenario | Command | Updates |
|----------|---------|---------|
| **Developing features** | `npm run dev` | `dist/` only (watch mode) |
| **Testing one-off change** | `npm run build` | `dist/` only |
| **Preparing for release** | `npm run build:plugin-ready` | `dist/` → `plugin-ready/` |
| **Creating distribution package** | `npm run build:plugin-ready:zip` | Everything |
| **Re-packaging without rebuild** | `npm run package` | `packages/*.zip` only |

## 📝 Best Practices

1. **Always use `npm run build:plugin-ready:zip`** before distributing
2. **Don't manually edit** `dist/` or `plugin-ready/` folders
3. **Test both** `dist/` (dev build) and `plugin-ready/` (production build) before release
4. **Keep folders in sync** by running the full pipeline when packaging
5. **Clean builds** with `npm run clean:all` if you encounter caching issues

## 🔍 Verifying Build Sync

Check if your builds are in sync:

```bash
# Check file timestamps
ls -la dist/*.html plugin-ready/*.html packages/*.zip

# If timestamps don't match, run:
npm run build:plugin-ready:zip
```

All three outputs should have similar timestamps after a full build.

---

**Last Updated:** Nov 2024

