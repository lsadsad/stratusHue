# StratusHue Penpot Quick Start Guide

> **TL;DR**: Use this guide to quickly start designing the stratusHue plugin UI in Penpot with MCP assistance.

---

## ⚡ 5-Minute Setup

### 1. Prerequisites Check
```bash
# Ensure MCP server is running
cd penpot-mcp
npm run bootstrap
```

### 2. Open Penpot
1. Navigate to [penpot.app](https://penpot.app)
2. Open/create a project for stratusHue
3. Load MCP plugin: `http://localhost:4400/manifest.json`
4. Click "Connect to MCP server"

### 3. Verify Cursor Integration
Check that `.cursor/mcp.json` exists in your project root (✅ already created).

---

## 🎨 Design System At-a-Glance

### Core Colors (Dark Theme)
```
Backgrounds:
  Primary:   #0f0f0f
  Secondary: #1a1a1a
  Tertiary:  #2a2a2a

Text:
  Primary:   #f5f5f5
  Secondary: #d4d4d4
  Muted:     rgba(255,255,255,0.6)

Accents:
  Red:    rgba(255,107,107,0.2)
  Green:  rgba(110,222,110,0.2)
  Yellow: rgba(255,193,7,0.2)
  Blue:   rgba(111,176,255,0.2)
```

### Spacing (8px Grid)
- XXS: 2px
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 20px
- XXL: 24px

### Typography
- **Header**: 13px / 600 weight
- **Body**: 11px / 400 weight
- **Button**: 11px / 500 weight
- **Small**: 10px / 400 weight

---

## 🚀 First AI Prompt (Copy & Paste)

```
@STRATUSHUE_PENPOT_BLUEPRINT.md I have Penpot MCP connected.

Let's create the stratusHue plugin UI. Start with Phase 1 - Foundations:

1. Create a new page called "stratusHue Design System"
2. Set up color swatches:
   - Background colors: #0f0f0f, #1a1a1a, #2a2a2a
   - Text colors: #f5f5f5, #d4d4d4, rgba(255,255,255,0.6)
   - Accent colors: Blue, Red, Green, Yellow (from blueprint)
3. Define text styles:
   - Header Title: 13px, weight 600
   - Body Text: 11px, weight 400
   - Button Label: 11px, weight 500
   - Small Text: 10px, weight 400
4. Create an 8px grid reference frame

Please start with step 1 and we'll work through each step.
```

---

## 📐 Quick Component Reference

### Plugin Dimensions
- **Width**: 240px (default)
- **Min Width**: 200px
- **Max Width**: 480px
- **Height**: Variable (scrollable)

### Section Structure

#### Quick Actions Bar (Header)
- **Height**: 40px
- **Layout**: 3 areas (left: back/forward, center: empty, right: settings)
- **Background**: #0a0a0a

#### Section Header (Reusable)
- **Height**: 40px
- **Layout**: Left (icon), Center (title), Right (action buttons)
- **Background**: #1a1a1a

#### Button Sizes
- **Standard**: 28px × 28px (nav buttons)
- **Large**: 44px × 44px (emoji buttons)
- **Grid Control**: ~72px × 44px (control buttons)

---

## 🎯 Build Order (Recommended)

### Phase 1: Foundations (15 mins)
```
1. Color swatches
2. Typography styles
3. Import icons
4. Grid system
```

### Phase 2: Buttons (20 mins)
```
1. Icon Button component
2. Emoji Button component
3. Control Grid Button component
4. Define all interactive states
```

### Phase 3: Headers (15 mins)
```
1. Section Header component
2. Quick Actions Bar
3. Add action button variations
```

### Phase 4: Tags Section (30 mins)
```
1. Section header with "Tags" title
2. 4×2 emoji grid
3. Date button
4. Page action buttons
5. Mode indicator
```

### Phase 5: Anchors Section (25 mins)
```
1. Section header with refresh/save buttons
2. Bookmark item component
3. Bookmarks list
4. Null state (empty state)
```

### Phase 6: Controls Section (45 mins)
```
1. Section header with delete button
2. Movement & Zoom grid (3×3)
3. Hierarchy Controls grid (2×3)
4. Sizing Controls grid (3×3)
```

### Phase 7: Assembly (20 mins)
```
1. Combine all sections
2. Add scrollable container
3. Test collapsible states
4. Create width variants
```

---

## 🎨 Essential Icon List

Copy this list when importing icons:

**Navigation** (3):
- ICO-navBack.svg
- ICO-navForward.svg
- ICO-settingsMenu.svg

**Tags Section** (5):
- ICO-removeTag.svg
- ICO-addDate.svg
- ICO-addPage.svg
- ICO-pageIndent-Left.svg
- ICO-pageIndent-Right.svg

**Anchors Section** (2):
- ICO-anchorRefresh.svg
- ICO-anchors.svg

**Controls Section** (19):
- ICO-delete.svg
- ICO-arrowUp/Down/Left/Right.svg (4)
- ICO-layerUp/Down.svg (2)
- ICO-folderUp/Down/Enter/Exit/Collapse.svg (5)
- ICO-menuNext/Prev.svg (2)
- ICO-component.svg
- ICO-pageUp/Down/Enter.svg (3)
- ICO-zoom100/In/Out.svg (3)

---

## 💬 Helpful AI Prompts

### Creating a Section
```
@STRATUSHUE_PENPOT_BLUEPRINT.md

Build the [SECTION NAME] section:
- Use section header component
- Add [SPECIFIC ELEMENTS]
- Apply spacing: [X]px padding, [Y]px gap
- Use colors from design system
- Include hover/active states
```

### Checking Your Work
```
@STRATUSHUE_PENPOT_BLUEPRINT.md

Review the [COMPONENT NAME] I just created:
1. Check colors match the design system
2. Verify spacing follows 8px grid
3. Confirm measurements are correct
4. Check for missing interactive states
```

### Exporting for Development
```
@STRATUSHUE_PENPOT_BLUEPRINT.md

Generate developer handoff documentation for:
1. Color tokens with CSS variable names
2. Component specifications with measurements
3. Interaction states and animations
4. Accessibility requirements
```

---

## ⚠️ Common Pitfalls

| Issue | Solution |
|-------|----------|
| Colors don't match | Use exact hex values from blueprint |
| Spacing looks off | Ensure 8px grid alignment |
| Icons wrong size | Use 14px for most, 16px for controls |
| Buttons feel cramped | Check padding and gap values |
| Text too large | Verify font sizes (11-13px range) |

---

## ✅ Quick Validation Checklist

Before moving to next phase:

**Colors**:
- [ ] Background colors match spec (#0f0f0f, #1a1a1a, #2a2a2a)
- [ ] Text colors have proper contrast
- [ ] Accent colors match exactly

**Spacing**:
- [ ] All spacing uses 8px grid
- [ ] Padding values are correct
- [ ] Gap between elements consistent

**Typography**:
- [ ] Font sizes correct (10-13px)
- [ ] Font weights match (400, 500, 600)
- [ ] Line heights appropriate

**Components**:
- [ ] All interactive states defined (default, hover, active, disabled)
- [ ] Icons are correct size
- [ ] Borders and radius match spec

---

## 🔗 Need More Details?

- **Full Specs**: `@STRATUSHUE_PENPOT_BLUEPRINT.md`
- **Penpot Help**: `@PENPOT_CONTEXT`
- **Context Guide**: `docs/context/README.md`

---

## 🎬 Ready to Start?

1. Open Penpot
2. Connect MCP plugin
3. Copy the "First AI Prompt" above
4. Paste into Cursor chat with the blueprint attached
5. Follow the build order phases

**Estimated Time**: 2-3 hours for complete interface  
**Skill Level**: Intermediate (with AI assistance)  
**Output**: Production-ready Penpot design file

---

*Quick Start Guide v1.0 | For stratusHue Plugin Design*

