# StratusHue Penpot Design Documentation Index

> **Central hub for all Penpot design resources, blueprints, and references for the stratusHue plugin UI.**

---

## 📚 Documentation Overview

This index provides quick access to all resources needed for designing the stratusHue plugin interface in Penpot, whether working manually or with AI assistance via MCP.

---

## 🎯 Quick Navigation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[Quick Start Guide](#quick-start)** | Get up and running in 5 minutes | Starting a new design session |
| **[Complete Blueprint](#blueprint)** | Full design specification | Detailed component work |
| **[Visual Reference](#visual)** | ASCII diagrams and measurements | Quick measurement lookup |
| **[Context Guide](#context)** | Using AI with Penpot MCP | Understanding the workflow |

---

## 📖 Document Descriptions

### <a id="quick-start"></a>📄 Penpot Quick Start Guide
**File**: `docs/context/PENPOT_QUICK_START.md`

**What's Inside**:
- ⚡ 5-minute setup instructions
- 🎨 Design system at-a-glance (colors, spacing, typography)
- 🚀 Ready-to-use first AI prompt
- 📐 Quick component reference
- 🎯 Recommended build order (7 phases)
- 💬 Helpful AI prompt templates

**Best For**:
- First-time Penpot users
- Quick reference during design work
- Copy-paste AI prompts
- Phase-by-phase build guidance

**Start Here If**: You want to begin designing immediately without reading everything.

---

### <a id="blueprint"></a>📄 Complete Design Blueprint
**File**: `docs/context/STRATUSHUE_PENPOT_BLUEPRINT.md`

**What's Inside**:
- 🎨 Complete design system (colors, typography, spacing, icons)
- 📐 Detailed component specifications with exact measurements
- 🧩 All UI sections breakdown (Tags, Anchors, Controls)
- 🎯 Interactive state definitions
- ♿ Accessibility requirements (ARIA, keyboard nav)
- 📦 Complete asset list (all 29 SVG icons)
- 🔧 Penpot-specific implementation instructions
- 📚 Component library structure
- ✅ Design completion checklist

**Best For**:
- Comprehensive reference during design
- Exact measurements and specifications
- Component state definitions
- Design system compliance
- Developer handoff preparation

**Use This When**: You need precise specifications for any component or section.

---

### <a id="visual"></a>📄 Visual Layout Reference
**File**: `docs/context/VISUAL_LAYOUT_REFERENCE.md`

**What's Inside**:
- 🖼️ ASCII diagrams of complete plugin layout
- 📏 Detailed measurements for every component
- 🎨 Visual color reference with gradients
- 📊 Spacing system visualization (8px grid)
- 🔲 Border radius reference
- 📐 Icon size reference
- 🎛️ Interactive state progression diagrams
- 📱 Width variant comparisons (200px, 240px, 360px)

**Best For**:
- Visual learners
- Quick measurement lookup
- Understanding spatial relationships
- Layout structure comprehension
- Copy-paste specifications

**Use This When**: You need to see the layout visually or grab quick measurements.

---

### <a id="context"></a>📄 Context Documentation Guide
**File**: `docs/context/README.md`

**What's Inside**:
- 📋 Overview of all context files
- 🎯 Quick start guide for Penpot design work
- 🤖 Example AI prompts for common tasks
- 📋 Design completion checklist
- 🔗 Related resource links
- 💡 Tips for AI-assisted design

**Best For**:
- Understanding the documentation structure
- Finding the right document for your task
- Learning AI-assisted workflows
- Tracking design progress

**Start Here If**: You want to understand what documentation is available.

---

## 🚀 Getting Started Workflow

### For New Users (Never Used Penpot Before)

```
1. Read: docs/context/README.md
   ↓
2. Set up: Follow PENPOT_QUICK_START.md setup section
   ↓
3. Design: Use PENPOT_QUICK_START.md build phases
   ↓
4. Reference: Keep VISUAL_LAYOUT_REFERENCE.md open
   ↓
5. Details: Check STRATUSHUE_PENPOT_BLUEPRINT.md as needed
```

### For Experienced Designers

```
1. Quick Scan: VISUAL_LAYOUT_REFERENCE.md (5 mins)
   ↓
2. Blueprint: STRATUSHUE_PENPOT_BLUEPRINT.md (15 mins)
   ↓
3. Start Designing: Use Quick Start prompts
   ↓
4. Reference: Use all docs as needed
```

### For AI-Assisted Design (with MCP)

```
1. Setup: .cursor/mcp.json ✅ (already created)
   ↓
2. Connect: Start Penpot MCP server
   ↓
3. Prompt: Copy from PENPOT_QUICK_START.md
   ↓
4. Build: Follow 7 phases from Quick Start
   ↓
5. Verify: Use Blueprint for specifications
```

---

## 🎨 Design System Quick Reference

### Colors (Dark Theme)
```css
/* Backgrounds */
--theme-bg-primary: #0f0f0f;
--theme-bg-secondary: #1a1a1a;
--theme-bg-tertiary: #2a2a2a;

/* Text */
--theme-text-primary: #f5f5f5;
--theme-text-secondary: #d4d4d4;
--theme-text-muted: rgba(255,255,255,0.6);

/* Accents */
--theme-accent-blue: rgba(111,176,255,0.2);
--theme-accent-red: rgba(255,107,107,0.2);
--theme-accent-green: rgba(110,222,110,0.2);
--theme-accent-yellow: rgba(255,193,7,0.2);
```

### Spacing (8px Grid)
- XXS: 2px | XS: 4px | SM: 8px
- MD: 12px | LG: 16px | XL: 20px | XXL: 24px

### Typography
- Header: 13px/600 | Body: 11px/400
- Button: 11px/500 | Small: 10px/400

---

## 📦 Component Inventory

### Atoms (Basic Building Blocks)
- ✅ Icon Button (28×28px)
- ✅ Emoji Button (44×44px)
- ✅ Control Grid Button (~72×44px)
- ✅ Action Button (32px height)

### Molecules (Combined Components)
- ✅ Section Header (40px height)
- ✅ Bookmark Item (56px height)
- ✅ Null State Component
- ✅ Mode Indicator

### Organisms (Complex Sections)
- ✅ Quick Actions Bar
- ✅ Tags Section (with emoji grid + actions)
- ✅ Anchors Section (with bookmarks list)
- ✅ Controls Section (3 grids: Movement, Hierarchy, Sizing)

### Templates
- ✅ Complete Plugin Layout (240px default)
- ✅ Width Variants (200px, 360px, 480px)

---

## 🎯 Build Phases Overview

### Phase 1: Foundations (15 mins)
**Create**: Color swatches, typography styles, import icons, grid system

**Files to Reference**:
- Blueprint: Design System section
- Visual Reference: Color & Spacing sections

---

### Phase 2: Atomic Components (20 mins)
**Create**: Button components (all types and states)

**Files to Reference**:
- Blueprint: Component Specifications → Buttons
- Visual Reference: Icon Size Reference

---

### Phase 3: Molecular Components (15 mins)
**Create**: Section headers, bookmark items, null states

**Files to Reference**:
- Blueprint: Section Header Component
- Visual Reference: Section Header diagram

---

### Phase 4: Tags Section (30 mins)
**Create**: Emoji grid, date button, page actions

**Files to Reference**:
- Blueprint: Tags Section
- Visual Reference: Tags Section diagrams

---

### Phase 5: Anchors Section (25 mins)
**Create**: Bookmarks list, null state

**Files to Reference**:
- Blueprint: Anchors Section
- Visual Reference: Anchors Section diagrams

---

### Phase 6: Controls Section (45 mins)
**Create**: Three control grids (Movement, Hierarchy, Sizing)

**Files to Reference**:
- Blueprint: Controls Section
- Visual Reference: Controls Section diagrams

---

### Phase 7: Final Assembly (20 mins)
**Create**: Complete layout, width variants, polish

**Files to Reference**:
- Visual Reference: Complete Plugin Layout
- Blueprint: Responsive Behavior

---

## 🤖 AI Prompt Templates

### Starting a New Section
```
@STRATUSHUE_PENPOT_BLUEPRINT.md 
@VISUAL_LAYOUT_REFERENCE.md

Using Penpot MCP, create the [SECTION_NAME] section:

1. Reference the specifications in the Blueprint
2. Use measurements from the Visual Reference
3. Apply design system tokens consistently
4. Include all interactive states
5. Verify spacing follows 8px grid

Please start with the section header.
```

### Checking Your Work
```
@STRATUSHUE_PENPOT_BLUEPRINT.md

Review my [COMPONENT_NAME] design and verify:
- ✓ Colors match design system exactly
- ✓ Spacing follows 8px grid
- ✓ Measurements are correct
- ✓ Interactive states are defined
- ✓ Accessibility requirements met

List any issues found.
```

### Exporting Specifications
```
@STRATUSHUE_PENPOT_BLUEPRINT.md

Generate developer handoff documentation for [SECTION]:
- Component specifications with measurements
- CSS custom properties for colors/spacing
- Interactive state definitions
- Accessibility implementation notes
```

---

## 📋 Design Completion Checklist

### ✅ Foundations Complete
- [ ] Color palette swatches in Penpot
- [ ] Typography styles defined
- [ ] All 29 SVG icons imported
- [ ] 8px grid reference frame created

### ✅ Components Complete
- [ ] Icon buttons (all states)
- [ ] Emoji buttons (all states)
- [ ] Control grid buttons (all states)
- [ ] Section header component
- [ ] Bookmark item component
- [ ] Null state component

### ✅ Sections Complete
- [ ] Quick Actions Bar
- [ ] Tags Section (collapsed & expanded)
- [ ] Anchors Section (with & without bookmarks)
- [ ] Controls Section (all 3 grids)

### ✅ Assembly Complete
- [ ] Full plugin layout (240px)
- [ ] Width variants (200px, 360px)
- [ ] Scrollable area configured
- [ ] Collapsible states working

### ✅ Documentation Complete
- [ ] Spacing annotations added
- [ ] Interaction patterns documented
- [ ] Developer specs generated
- [ ] CSS exported for reference
- [ ] Accessibility notes included

---

## 🔗 Additional Resources

### In This Repository
| Resource | Path | Purpose |
|----------|------|---------|
| Current HTML | `src/ui.html` | Implementation reference |
| Current CSS | `src/styles.css` | Style implementation |
| SVG Icons | `assets/` | All icon assets |
| Feature Docs | `docs/features/` | Feature specifications |
| Architecture | `docs/features/CURRENT_PLUGIN_STRUCTURE_ANALYSIS.md` | Code architecture |

### External Resources
| Resource | URL | Purpose |
|----------|-----|---------|
| Penpot Help | https://help.penpot.app/ | Official docs |
| Penpot MCP | https://github.com/penpot/penpot-mcp | MCP integration |
| MCP Protocol | https://modelcontextprotocol.io/ | Protocol spec |
| Penpot Community | https://community.penpot.app/ | Community forum |

---

## 💡 Pro Tips

### For Efficient Design
1. **Work in Phases**: Complete one phase before moving to next
2. **Use Components**: Create reusable components early
3. **Test States**: Verify all interactive states work
4. **Check Alignment**: Use 8px grid guides constantly
5. **Name Consistently**: Follow naming conventions from Blueprint

### For AI Assistance
1. **Be Specific**: Reference exact sections from docs
2. **One Task at a Time**: Don't ask for multiple components at once
3. **Verify Output**: Check measurements against specs
4. **Iterate**: Refine components based on visual review
5. **Save Progress**: Export components regularly

### For Design System Compliance
1. **Use Tokens**: Reference color/spacing tokens by name
2. **Stay on Grid**: Everything aligns to 8px grid
3. **Consistent States**: All buttons have same state behavior
4. **Accessibility**: Include ARIA labels and keyboard nav
5. **Document Changes**: Note any deviations from spec

---

## 🎬 Ready to Start?

### Complete Beginner Path
```
1. Read this index (you are here! ✓)
2. Read: docs/context/README.md
3. Setup: docs/context/PENPOT_QUICK_START.md
4. Design: Follow 7 phases with AI prompts
5. Reference: Use Blueprint + Visual Reference as needed
```

### Experienced Designer Path
```
1. Scan: VISUAL_LAYOUT_REFERENCE.md (5 mins)
2. Read: STRATUSHUE_PENPOT_BLUEPRINT.md (15 mins)
3. Start: Use Quick Start AI prompts
4. Build: Create components systematically
5. Verify: Check against specifications
```

### Time Estimates
- **With AI Assistance**: 2-3 hours total
- **Manual Design**: 4-6 hours total
- **Review & Polish**: +1 hour

---

## 📞 Need Help?

### Common Issues
| Problem | Solution | Document |
|---------|----------|----------|
| MCP won't connect | Check server running on port 4401 | Quick Start → Setup |
| Colors don't match | Use exact hex from design system | Blueprint → Colors |
| Spacing looks wrong | Verify 8px grid alignment | Visual Reference → Spacing |
| Missing icons | Check assets/ folder for all 29 icons | Blueprint → Assets |
| States not working | Review state definitions | Blueprint → Interactive States |

### Documentation Questions
- **"Where do I start?"** → Read the Context Guide (README.md)
- **"What's this component size?"** → Check Visual Reference
- **"What colors do I use?"** → Check Blueprint Design System
- **"How do I use AI?"** → Check Quick Start AI prompts
- **"Is my design correct?"** → Use completion checklist

---

## 📊 Documentation Statistics

| Document | Size | Read Time | Detail Level |
|----------|------|-----------|--------------|
| This Index | 1 page | 5 mins | Overview |
| Quick Start | 5 pages | 10 mins | High-level |
| Blueprint | 25 pages | 45 mins | Complete |
| Visual Reference | 12 pages | 20 mins | Visual |
| Context Guide | 3 pages | 10 mins | Meta |

**Total Documentation**: ~46 pages  
**Complete Read Time**: ~90 minutes  
**Quick Start Time**: ~15 minutes (Index + Quick Start)

---

## ✨ Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial release - Complete documentation suite |

---

## 🎯 Success Criteria

Your Penpot design is complete when:
- ✅ All components match Blueprint specifications
- ✅ Colors use exact hex values from design system
- ✅ All spacing aligns to 8px grid
- ✅ Interactive states are defined for all buttons
- ✅ Layout matches Visual Reference diagrams
- ✅ Width variants work correctly (200px, 240px, 360px)
- ✅ Accessibility requirements are met
- ✅ Developer handoff documentation is generated

---

**Happy Designing! 🎨**

*For questions or issues, refer to the individual documents or create an issue in the repository.*

---

*Index Version: 1.0*  
*Last Updated: December 2024*  
*For: stratusHue Plugin Penpot Design Work*  
*Total Pages: 46 | Estimated Design Time: 2-6 hours*

