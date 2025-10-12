# Navigation Section Missing - Sync Checklist

## Issue
Navigation section not appearing on another laptop after pulling from GitHub.

## Files to Verify on Other Laptop

### 1. Source Files (should be identical)
- [ ] `src/ui.html` - Contains navigation-section HTML
- [ ] `src/ui.ts` - Contains navigation controls logic  
- [ ] `src/features/navigation.ts` - Contains navigation functionality
- [ ] `manifest.json` - Points to correct UI file

### 2. Built Files (need to be regenerated)
- [ ] `dist/ui.html` - Contains navigation section
- [ ] `dist/code.js` - Contains navigation logic
- [ ] `plugin-ready/ui.html` - Production version with navigation

### 3. Git Status Check
```bash
# On the other laptop, run:
git status
git log --oneline -5
git diff HEAD origin/develop
```

## Troubleshooting Steps

### Step 1: Verify Source Files
```bash
# Check if navigation section exists in source
grep -n "navigation-section" src/ui.html
grep -n "updateNavigationControlsVisibility" src/ui.ts
```

### Step 2: Rebuild Everything
```bash
# Clean and rebuild
npm run clean:all
npm install
npm run build
npm run build:plugin-ready
```

### Step 3: Check Plugin Loading
1. In Figma, go to Plugins → Development → Import plugin from manifest
2. Select the `manifest.json` file (not from dist/ or plugin-ready/)
3. Or use the plugin-ready version: select `plugin-ready/manifest.json`

### Step 4: Check Settings
1. Open the plugin
2. Click the settings button (≡)
3. Verify "Navigation Controls" toggle is checked
4. If unchecked, check it and close settings

### Step 5: Clear Plugin Cache
1. Close Figma completely
2. Clear browser cache if using Figma in browser
3. Restart Figma
4. Reload the plugin

## Expected Navigation Section Structure

The navigation section should appear between ANCHORS and the settings, containing:

```
🧭 NAVIGATION
├── Exit (↑)     │ Next (→)
├── Collapse (⌄) │ Prev (↓)  
└── Expand (↓) [full width]
```

## Debug Commands

### Check if navigation exists in built files:
```bash
grep -c "navigation-section" dist/ui.html
grep -c "navigation-section" plugin-ready/ui.html
```

### Check navigation controls in JavaScript:
```bash
grep -c "updateNavigationControlsVisibility" dist/ui.html
grep -c "updateNavigationControlsVisibility" plugin-ready/ui.html
```

## Common Issues & Solutions

### Issue: Navigation section hidden by setting
**Solution:** Check settings toggle, or reset plugin storage:
```javascript
// In browser console when plugin is open:
figma.clientStorage.setAsync('navigationControlsEnabled', true)
```

### Issue: Old build files
**Solution:** Force rebuild:
```bash
rm -rf dist/ plugin-ready/
npm run build:plugin-ready
```

### Issue: Wrong manifest file
**Solution:** Ensure using root `manifest.json`, not one in dist/ or plugin-ready/

### Issue: Plugin cache
**Solution:** 
1. Use different plugin name temporarily
2. Or clear Figma cache completely

## Verification Checklist

After following steps above, verify:
- [ ] Navigation section appears in plugin UI
- [ ] Navigation buttons are present (Exit, Next, Prev, Expand, Collapse)
- [ ] Buttons respond to clicks (may be disabled if no selection)
- [ ] Settings toggle for Navigation Controls works
- [ ] Navigation section can be collapsed/expanded via header

## Files That Must Be Identical

These files should be exactly the same on both laptops:
- `src/ui.html` (contains navigation HTML)
- `src/ui.ts` (contains navigation JavaScript)
- `src/features/navigation.ts` (navigation logic)
- `manifest.json` (plugin configuration)

## Build Files That Need Regeneration

These files are generated and should be rebuilt on the other laptop:
- `dist/ui.html`
- `dist/code.js`  
- `plugin-ready/ui.html`
- `plugin-ready/code.js`
- `plugin-ready/manifest.json`