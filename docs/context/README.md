# Context Documentation

This folder contains context files for AI-assisted development and design work with the stratusHue plugin.

## 📄 Files in This Folder

### `PENPOT_CONTEXT`
**Purpose**: General guide for using Penpot with MCP integration  
**Use For**: 
- Setting up Penpot MCP server
- Understanding Penpot's features and capabilities
- Configuring Cursor/Claude for Penpot integration
- General Penpot design workflows

**When to Use**: Include this file when you need help with Penpot basics, MCP setup, or general design system work.

---

### `STRATUSHUE_PENPOT_BLUEPRINT.md`
**Purpose**: Complete design specification for the stratusHue plugin UI  
**Use For**:
- Recreating the stratusHue interface in Penpot
- Understanding component structure and hierarchy
- Implementing the exact design system (colors, typography, spacing)
- AI-assisted design via Penpot MCP

**When to Use**: Include this file when working on stratusHue UI design in Penpot.

#### What's Inside:
- ✅ Complete color palette with hex values
- ✅ Typography specifications (sizes, weights, line heights)
- ✅ Spacing system (8px grid)
- ✅ All component specifications with exact measurements
- ✅ Interactive state definitions
- ✅ Layout hierarchy and structure
- ✅ Accessibility requirements
- ✅ Asset list (all required SVG icons)
- ✅ Penpot-specific implementation instructions
- ✅ Example AI prompts for MCP-assisted design

---

## 🎯 Quick Start Guide

### For Penpot Design Work

1. **Set up Penpot MCP** (first time only):
   - See `PENPOT_CONTEXT` for setup instructions
   - Ensure Cursor has MCP integration configured
   - Start Penpot MCP server (`npm run bootstrap`)
   - Connect plugin in Penpot

2. **Start Designing stratusHue UI**:
   ```
   @STRATUSHUE_PENPOT_BLUEPRINT.md I have Penpot MCP connected.
   
   Please help me create the stratusHue plugin interface in Penpot.
   Let's start by setting up the color palette and component library.
   ```

3. **Follow the blueprint phases**:
   - Phase 1: Foundations (colors, typography, icons)
   - Phase 2: Atomic Components (buttons)
   - Phase 3: Molecular Components (section headers, bookmark items)
   - Phase 4: Sections (Tags, Anchors, Controls)
   - Phase 5: Full Layout
   - Phase 6: Documentation

---

## 🤖 Example AI Prompts

### Setting Up the Design System
```
@STRATUSHUE_PENPOT_BLUEPRINT.md Connected to Penpot MCP.

Create the foundation for stratusHue:
1. Set up all color swatches from the Boilerplate theme
2. Define the typography styles
3. Import the icon assets
4. Create an 8px grid reference frame
```

### Building Components
```
@STRATUSHUE_PENPOT_BLUEPRINT.md Using Penpot MCP.

Build the Tags Section component:
- Create the section header with "Tags" title and remove button
- Add the 4×2 emoji grid (🟥🟧🟨🟩🟦🟪⬛⬜)
- Include the date button and page action buttons
- Apply proper spacing and colors from the design system
```

### Creating the Full Interface
```
@STRATUSHUE_PENPOT_BLUEPRINT.md Penpot MCP is connected.

Assemble the complete stratusHue plugin interface:
1. Quick Actions Bar at top (back/forward/settings)
2. Tags Section (collapsible)
3. Anchors Section (collapsible, with null state)
4. Controls Section (collapsible, with all three grids)

Use the specifications from the blueprint for exact measurements.
```

---

## 📋 Design Completion Checklist

Use this checklist when creating the stratusHue UI in Penpot:

**Foundations** (Phase 1):
- [ ] Color palette swatches created
- [ ] Typography styles defined
- [ ] All SVG icons imported
- [ ] 8px grid reference created

**Components** (Phase 2-3):
- [ ] Button components (all variants)
- [ ] Section header component
- [ ] Bookmark item component
- [ ] Null state component

**Sections** (Phase 4):
- [ ] Quick Actions Bar
- [ ] Tags Section (with emoji grid)
- [ ] Anchors Section (with bookmarks list)
- [ ] Controls Section (all three grids)

**Assembly** (Phase 5):
- [ ] Full plugin layout
- [ ] Responsive variants (200px, 240px, 360px)
- [ ] Collapsible states

**Documentation** (Phase 6):
- [ ] Spacing annotations
- [ ] Interaction documentation
- [ ] Developer handoff specs
- [ ] CSS export

---

## 🔗 Related Resources

### In This Repository
- `/src/ui.html` - Current HTML structure
- `/src/styles.css` - Current CSS implementation
- `/assets/` - All SVG icons
- `README.md` - Plugin feature overview

### External
- [Penpot Documentation](https://help.penpot.app/)
- [Penpot MCP Repository](https://github.com/penpot/penpot-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 💡 Tips for AI-Assisted Design

1. **Be Specific**: Reference exact measurements from the blueprint
2. **One Section at a Time**: Build incrementally, testing as you go
3. **Use Design Tokens**: Reference color/spacing tokens by name
4. **Verify States**: Ensure hover, active, and disabled states are correct
5. **Check Accessibility**: Test keyboard navigation and ARIA labels
6. **Export Often**: Generate CSS for implementation reference

---

*Last Updated: December 2024*  
*For: stratusHue Plugin Design Work*

