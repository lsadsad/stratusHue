# StratusHue Plugin - Penpot Design Blueprint

> **Purpose**: Complete design specification for recreating the StratusHue Figma plugin UI in Penpot. This document provides all necessary information for AI-assisted design via MCP or manual Penpot design work.

---

## 📋 Project Overview

**Plugin Name**: stratusHue  
**Type**: Figma Plugin for design organization and navigation  
**Purpose**: Strategic color coding and intelligent bookmarking of design elements  
**UI Style**: Modern dark-themed plugin interface with collapsible sections

---

## 🎨 Design System

### Color Palette

#### Boilerplate Theme (Default Dark Theme)

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-bg-primary` | `#0f0f0f` | Main background color |
| `--theme-bg-secondary` | `#1a1a1a` | Secondary surfaces |
| `--theme-bg-tertiary` | `#2a2a2a` | Tertiary surfaces, buttons |
| `--theme-bg-elevated` | `#0a0a0a` | Elevated panels |
| `--theme-bg-accent` | `#404040` | Accent backgrounds |
| `--theme-bg-hover` | `rgba(42, 42, 42, 0.2)` | Hover states |
| `--theme-bg-active` | `rgba(64, 64, 64, 0.2)` | Active/pressed states |

#### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-text-primary` | `#f5f5f5` | Primary text |
| `--theme-text-secondary` | `#d4d4d4` | Secondary text |
| `--theme-text-muted` | `rgba(255, 255, 255, 0.6)` | Muted/disabled text |
| `--theme-text-subtle` | `rgba(255, 255, 255, 0.8)` | Subtle text |
| `--theme-text-disabled` | `rgba(255, 255, 255, 0.4)` | Disabled state |

#### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-border-primary` | `#2a2a2a` | Primary borders |
| `--theme-border-secondary` | `#404040` | Secondary borders |
| `--theme-border-accent` | `#13171B` | Accent borders |

#### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-accent-red` | `rgba(255, 107, 107, 0.20)` | Red tag/indicator |
| `--theme-accent-green` | `rgba(110, 222, 110, 0.20)` | Green tag/indicator |
| `--theme-accent-yellow` | `rgba(255, 193, 7, 0.20)` | Yellow tag/indicator |
| `--theme-accent-blue` | `rgba(111, 176, 255, 0.20)` | Blue tag/indicator |
| `--theme-accent-pink` | `rgba(255, 105, 180, 0.4)` | Pink tag/indicator |

#### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-success` | `#4ade80` | Success states |
| `--theme-warning` | `rgba(255, 193, 7, 0.9)` | Warning states |
| `--theme-error` | `#ff6b6b` | Error states |
| `--theme-info` | `rgba(111, 176, 255, 0.9)` | Info states |

### Typography

| Style | Font Size | Font Weight | Line Height | Usage |
|-------|-----------|-------------|-------------|-------|
| **Header Title** | 13px | 600 (Semi-bold) | 1.2 | Section headers |
| **Body Text** | 11px | 400 (Regular) | 1.4 | Body content |
| **Button Label** | 11px | 500 (Medium) | 1.2 | Button text |
| **Small Text** | 10px | 400 (Regular) | 1.3 | Secondary labels |
| **Null State** | 11px | 400 (Regular) | 1.4 | Empty states |

**Font Family**: System default (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)

### Spacing System (8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xxs` | 2px | Micro spacing |
| `--spacing-xs` | 4px | Extra small |
| `--spacing-sm` | 8px | Small |
| `--spacing-md` | 12px | Medium |
| `--spacing-lg` | 16px | Large |
| `--spacing-xl` | 20px | Extra large |
| `--spacing-xxl` | 24px | Extra extra large |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--border-radius-sm` | 4px | Small elements |
| `--border-radius-md` | 6px | Medium elements |
| `--border-radius-lg` | 8px | Large elements |
| `--border-radius-full` | 9999px | Circular/pill shapes |

### Icon Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--icon-size-sm` | 12px | Small icons |
| `--icon-size-md` | 14px | Medium icons |
| `--icon-size-lg` | 16px | Large icons |
| `--icon-size-xl` | 20px | Extra large icons |

---

## 📐 Layout Structure

### Overall Dimensions

- **Default Width**: 240px
- **Minimum Width**: 200px
- **Maximum Width**: 480px
- **Height**: Variable (scrollable content)

### Plugin Layout Hierarchy

```
┌─────────────────────────────────────┐
│  Quick Actions Bar                  │ ← Fixed header
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ Tags Section (Collapsible)    │  │ ← Scrollable
│  │ - Color emoji grid            │  │   content
│  │ - Date button                 │  │
│  │ - Page actions                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Anchors Section (Collapsible) │  │
│  │ - Bookmarks list              │  │
│  │ - Null state                  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Controls Section (Collapsible)│  │
│  │ - Movement grid (3x3)         │  │
│  │ - Hierarchy controls          │  │
│  │ - Sizing controls             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🧩 Component Specifications

### 1. Quick Actions Bar (Header)

**Location**: Top of plugin, fixed position  
**Height**: 40px  
**Background**: `--theme-bg-elevated` (`#0a0a0a`)  
**Padding**: 8px (all sides)  
**Border Bottom**: 1px solid `--theme-border-primary`

#### Layout Grid

```
┌────────────────────────────────────────────────┐
│ [◀] [▶]          [empty]            [⚙️]     │
│  Left            Center              Right     │
└────────────────────────────────────────────────┘
```

**Structure**:
- **Left Area**: Navigation buttons (Back, Forward)
- **Center Area**: Empty (reserved for future features)
- **Right Area**: Settings button

#### Buttons

**Navigation Buttons** (Back/Forward):
- **Size**: 28px × 28px
- **Border Radius**: 4px
- **Background**: Transparent
- **Background (Hover)**: `--theme-bg-hover`
- **Background (Active)**: `--theme-bg-active`
- **Icon**: 14px × 14px SVG
- **State**: Disabled by default (opacity 0.4)

**Settings Button**:
- **Size**: 28px × 28px
- **Border Radius**: 4px
- **Background**: Transparent
- **Background (Hover)**: `--theme-bg-hover`
- **Background (Active)**: `--theme-bg-active`
- **Icon**: 14px × 14px (`ICO-settingsMenu.svg`)

---

### 2. Section Header Component (Reusable)

**Height**: 40px  
**Background**: `--theme-bg-secondary` (`#1a1a1a`)  
**Padding**: 8px 12px  
**Border Radius**: 6px (top)  
**Margin Bottom**: 0px (when expanded)

#### Layout Grid

```
┌────────────────────────────────────────────────┐
│  [icon]  Section Title          [btn] [btn]    │
│   Left      Center                Right        │
└────────────────────────────────────────────────┘
```

#### Title Typography
- **Font Size**: 13px
- **Font Weight**: 600 (Semi-bold)
- **Color**: `--theme-text-primary`
- **Text Transform**: None

#### Action Buttons (Right Side)
- **Size**: 28px × 28px
- **Border Radius**: 4px
- **Background**: Transparent
- **Background (Hover)**: `--theme-bg-hover`
- **Background (Active)**: Brand color tint
- **Icon Size**: 14px × 14px
- **Gap Between**: 4px

#### States
- **Default**: Clickable, `aria-expanded="true"`
- **Collapsed**: `aria-expanded="false"`, rotate collapse indicator
- **Hover**: Subtle background change
- **Active**: Slight scale or color shift

---

### 3. Tags Section (Color Coding)

#### Section Header
- **Title**: "Tags"
- **Right Button**: Clear/Remove Tag button (`ICO-removeTag.svg`)

#### Content Structure

**Color Emoji Grid**:
- **Layout**: 4 columns × 2 rows (8 emojis)
- **Gap**: 8px horizontal, 8px vertical
- **Padding**: 16px (all sides)

**Emoji Buttons**:
- **Size**: 44px × 44px
- **Border Radius**: 6px
- **Background**: `--theme-bg-tertiary` (`#2a2a2a`)
- **Background (Hover)**: `--theme-bg-hover`
- **Background (Active)**: Corresponding accent color
- **Emoji Size**: 24px

**Emoji Set**:
- 🟥 Red (square)
- 🟧 Orange (square)
- 🟨 Yellow (square)
- 🟩 Green (square)
- 🟦 Blue (square)
- 🟪 Purple (square)
- ⬛ Black (square)
- ⬜ White (square)

**Mode Indicator**:
- **Position**: Below emoji grid
- **Text**: "(Layer)" or "(Page)"
- **Font Size**: 10px
- **Color**: `--theme-text-muted`
- **Alignment**: Center

#### Date & Page Actions

**Date Button**:
- **Width**: Full width (minus padding)
- **Height**: 32px
- **Border Radius**: 4px
- **Background**: `--theme-bg-tertiary`
- **Background (Hover)**: `--theme-bg-hover`
- **Icon**: `ICO-addDate.svg` (14px)
- **Label**: "Add Date"
- **Margin Top**: 12px

**Page Actions Group**:
- **Layout**: Horizontal flex
- **Gap**: 8px
- **Margin Top**: 8px

Three buttons:
1. **New Page** (`ICO-addPage.svg`)
2. **Indent Title Left** (`ICO-pageIndent-Left.svg`)
3. **Indent Title Right** (`ICO-pageIndent-Right.svg`)

Each button:
- **Width**: ~76px (equal distribution)
- **Height**: 32px
- **Border Radius**: 4px
- **Background**: `--theme-bg-tertiary`
- **Icon**: 14px centered

---

### 4. Anchors Section (Bookmarks)

#### Section Header
- **Title**: "Anchors"
- **Right Buttons**: 
  - Refresh button (`ICO-anchorRefresh.svg`)
  - Save/Drop Anchor button (`ICO-anchors.svg`)

#### Content Structure

**Bookmarks List**:
- **Layout**: Vertical list
- **Gap**: 4px
- **Padding**: 12px
- **Max Height**: Variable (scrollable)

**Bookmark Item**:
- **Height**: 56px
- **Border Radius**: 4px
- **Background**: `--theme-bg-tertiary`
- **Background (Hover)**: `--theme-bg-hover`
- **Padding**: 12px
- **Cursor**: pointer

**Bookmark Structure**:
```
┌────────────────────────────────┐
│ Layer Name                     │ ← Primary text (11px, semi-bold)
│ on: Page Name                  │ ← Secondary text (10px, muted)
└────────────────────────────────┘
```

**Typography**:
- **Layer Name**: 11px, weight 600, `--theme-text-primary`
- **Page Context**: 10px, weight 400, `--theme-text-secondary`
- **Text Overflow**: Ellipsis

**Null State** (No Bookmarks):
- **Icon**: ⚓️ (32px emoji)
- **Text**: "Pick your target and drop an anchor to save your spot"
- **Alignment**: Center
- **Text Color**: `--theme-text-muted`
- **Padding**: 24px vertical

---

### 5. Controls Section

#### Section Header
- **Title**: "Controls"
- **Right Button**: Delete button (`ICO-delete.svg`, disabled by default)

#### Content Structure

**Movement & Zoom Grid** (3×3):

```
┌─────────────────────────────────────┐
│   [Layer↑]  [Arrow↑]   [Layer↓]    │
│   [Arrow←]  [Zoom In]  [Arrow→]    │
│   [Folder↑] [Arrow↓]   [Folder↓]   │
└─────────────────────────────────────┘
```

**Grid Specifications**:
- **Columns**: 3
- **Rows**: 3
- **Gap**: 8px
- **Padding**: 24px (horizontal), 16px (vertical)

**Control Button**:
- **Size**: ~72px × 44px (adaptive to container)
- **Border Radius**: 6px
- **Background**: `--theme-bg-tertiary`
- **Background (Hover)**: `--theme-bg-hover`
- **Background (Active)**: `--theme-bg-active`
- **Icon Size**: 16px

**Button Grid Icons**:
- Row 1: `ICO-layerUp.svg`, `ICO-arrowUp.svg`, `ICO-layerDown.svg`
- Row 2: `ICO-arrowLeft.svg`, `ICO-zoomIn.svg`, `ICO-arrowRight.svg`
- Row 3: `ICO-folderUp.svg`, `ICO-arrowDown.svg`, `ICO-folderDown.svg`

#### Hierarchy Controls Grid (2×3)

**Layout**: 2 rows × 3 columns  
**Gap**: 8px  
**Margin Top**: 12px

```
┌─────────────────────────────────────┐
│  [Enter]    [Exit]    [Collapse]    │
│  [Tab]   [Shift+Tab]  [Component]   │
└─────────────────────────────────────┘
```

**Icons**:
- Row 1: `ICO-folderEnter.svg`, `ICO-folderExit.svg`, `ICO-foldeCollapse.svg`
- Row 2: `ICO-menuNext.svg`, `ICO-menuPrev.svg`, `ICO-component.svg`

#### Sizing Controls Grid (3×3)

**Layout**: 3 rows × 3 columns  
**Gap**: 8px  
**Margin Top**: 12px

```
┌─────────────────────────────────────┐
│  [Page↑]    [Page▲]    [Page↓]     │
│  [Page◄]    [Fit]      [Page►]     │
│  [Indent←]  [Page▼]    [Indent→]   │
└─────────────────────────────────────┘
```

**Icons**:
- Row 1: `ICO-pageUp.svg`, `ICO-pageEnter.svg`, `ICO-pageDown.svg`
- Row 2: `ICO-pageIndent-Left.svg`, `ICO-zoom100.svg`, `ICO-pageIndent-Right.svg`
- Row 3: Additional page controls

---

## 🎯 Interactive States

### Button States

| State | Visual Changes |
|-------|----------------|
| **Default** | Base background, full opacity |
| **Hover** | `--theme-bg-hover` background, slight scale (1.02) |
| **Active/Pressed** | `--theme-bg-active` background, scale (0.98) |
| **Disabled** | Opacity 0.4, cursor not-allowed, no hover effect |
| **Focus** | 2px outline, `--theme-info` color, 2px offset |

### Collapsible Section States

| State | Visual Changes |
|-------|----------------|
| **Expanded** | Content visible, `aria-expanded="true"` |
| **Collapsed** | Content hidden, `aria-expanded="false"` |
| **Animating** | 200ms ease-out transition |

### Bookmark Item States

| State | Visual Changes |
|-------|----------------|
| **Default** | Base background |
| **Hover** | `--theme-bg-hover` background, subtle border |
| **Active** | `--theme-bg-active` background |

---

## 📱 Responsive Behavior

### Width Adaptation

| Width Range | Behavior |
|-------------|----------|
| **200-240px** | Default, compact layout |
| **241-360px** | Comfortable spacing, slightly larger buttons |
| **361-480px** | Expanded layout, more padding |

### Height/Scrolling

- **Quick Actions**: Fixed at top
- **Sections**: Scrollable content area
- **Scroll Behavior**: Smooth scrolling
- **Scrollbar**: Custom styled, 8px width, rounded thumb

---

## ♿ Accessibility Requirements

### ARIA Labels

- All buttons have `aria-label` attributes
- Sections have `aria-labelledby` referencing headers
- Collapsible sections use `aria-expanded`
- Grids use `role="grid"`, `role="row"`, `role="gridcell"`

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons
- **Arrow Keys**: Navigate within grids
- **Escape**: Close overlays/modals

### Focus Management

- Visible focus indicators (2px outline)
- Logical tab order
- Focus trap in modal overlays
- Skip links for screen readers

### Screen Reader Support

- Hidden descriptive text (`.sr-only` class)
- ARIA descriptions for complex controls
- Status announcements for state changes

---

## 🎨 Penpot-Specific Design Instructions

### Component Library Structure

Create a Penpot library named: `stratusHue-component-library`

```
stratusHue-component-library/
├── Foundations/
│   ├── Colors/
│   │   ├── Background Colors (swatches)
│   │   ├── Text Colors (swatches)
│   │   ├── Border Colors (swatches)
│   │   └── Accent Colors (swatches)
│   ├── Typography/
│   │   ├── Header Title (text style)
│   │   ├── Body Text (text style)
│   │   ├── Button Label (text style)
│   │   └── Small Text (text style)
│   └── Spacing/
│       └── 8px Grid Reference
├── Atoms/
│   ├── Icon Button
│   ├── Text Button
│   ├── Action Button
│   └── Emoji Button
├── Molecules/
│   ├── Section Header
│   ├── Bookmark Item
│   ├── Control Grid Button
│   └── Null State
├── Organisms/
│   ├── Quick Actions Bar
│   ├── Tags Section
│   ├── Anchors Section
│   └── Controls Section
└── Templates/
    └── Plugin Layout (Full Interface)
```

### Layout System

Use **Penpot Flex Layout** (CSS Flexbox):

**Main Container**:
- Direction: Column
- Alignment: Stretch
- Gap: 0px
- Padding: 0px

**Section Content**:
- Direction: Column
- Alignment: Stretch
- Gap: 8-12px
- Padding: 12-24px

**Button Grids**:
- Direction: Row
- Wrap: Wrap
- Alignment: Start
- Gap: 8px

### Naming Conventions

| Element Type | Convention | Example |
|--------------|------------|---------|
| **Frames** | PascalCase | `QuickActionsBar`, `TagsSection` |
| **Components** | PascalCase | `IconButton`, `SectionHeader` |
| **Layers** | kebab-case | `button-container`, `icon-wrapper` |
| **Colors** | Descriptive | `bg-primary`, `text-secondary` |

---

## 📦 Asset Requirements

### SVG Icons (All 14×14px or 16×16px)

Required icons from `/assets/`:

**Navigation**:
- ICO-navBack.svg
- ICO-navForward.svg
- ICO-settingsMenu.svg

**Tags Section**:
- ICO-removeTag.svg
- ICO-addDate.svg
- ICO-addPage.svg
- ICO-pageIndent-Left.svg
- ICO-pageIndent-Right.svg

**Anchors Section**:
- ICO-anchorRefresh.svg
- ICO-anchors.svg

**Controls Section**:
- ICO-delete.svg
- ICO-arrowUp.svg
- ICO-arrowDown.svg
- ICO-arrowLeft.svg
- ICO-arrowRight.svg
- ICO-layerUp.svg
- ICO-layerDown.svg
- ICO-folderUp.svg
- ICO-folderDown.svg
- ICO-folderEnter.svg
- ICO-folderExit.svg
- ICO-foldeCollapse.svg
- ICO-menuNext.svg
- ICO-menuPrev.svg
- ICO-component.svg
- ICO-pageUp.svg
- ICO-pageDown.svg
- ICO-pageEnter.svg
- ICO-zoom100.svg
- ICO-zoomIn.svg
- ICO-zoomOut.svg

### Icon States

- **Default**: Full color/opacity
- **Hover**: Slight brightness increase
- **Active**: Brand color tint
- **Disabled**: 40% opacity

---

## 🔧 Implementation Notes for Penpot MCP

### Phase 1: Foundations
1. Create color palette swatches
2. Define typography styles
3. Set up 8px grid reference frame
4. Import all SVG icons

### Phase 2: Atomic Components
1. Create button components (all variants)
2. Define interactive states
3. Add component descriptions

### Phase 3: Molecular Components
1. Build section header component
2. Create bookmark item component
3. Design null state component

### Phase 4: Sections
1. Build Quick Actions Bar
2. Design Tags Section (collapsed & expanded)
3. Design Anchors Section (with and without bookmarks)
4. Design Controls Section (all three grids)

### Phase 5: Full Layout
1. Assemble complete plugin interface
2. Create variants for different widths
3. Add scrollable area simulation
4. Document all components

### Phase 6: Documentation
1. Add annotations for spacing
2. Document interaction patterns
3. Create developer handoff specs
4. Export CSS for implementation

---

## 📚 Design Principles

### Visual Hierarchy
1. **Primary**: Section headers and main actions
2. **Secondary**: Content within sections
3. **Tertiary**: Metadata and helper text

### Consistency
- Use design tokens consistently
- Maintain 8px grid alignment
- Consistent button sizing within contexts
- Uniform hover/active states

### Accessibility
- WCAG 2.1 AA compliance
- 4.5:1 contrast ratio for text
- Keyboard navigable
- Screen reader friendly

### Performance
- Minimize nested components
- Use shared color styles
- Optimize SVG assets
- Efficient layout system

---

## 🎬 Example AI Prompts for Penpot MCP

### Getting Started

```
@STRATUSHUE_PENPOT_BLUEPRINT.md I have Penpot MCP connected.

Please help me set up the stratusHue plugin design:
1. Create a new page called "stratusHue Components"
2. Set up color swatches from the design system
3. Create text styles for all typography variants
4. Import the icon assets from the specification
```

### Building Components

```
@STRATUSHUE_PENPOT_BLUEPRINT.md Using Penpot MCP:

Create the Section Header component with:
- Three areas: left (icon), center (title), right (action buttons)
- Use Flex Layout: row, space-between alignment
- Height: 40px, padding: 8px 12px
- Background: --theme-bg-secondary (#1a1a1a)
- Add hover states per specification
```

### Creating Sections

```
@STRATUSHUE_PENPOT_BLUEPRINT.md Connected to Penpot MCP.

Build the Tags Section:
1. Add section header with "Tags" title
2. Create 4×2 emoji button grid
3. Add date button below grid
4. Add three page action buttons
5. Use proper spacing (16px padding, 8px gaps)
6. Apply color tokens from design system
```

---

## 📎 Related Documentation

- `@PENPOT_CONTEXT.md` - Penpot MCP setup and integration guide
- `README.md` - StratusHue plugin feature overview
- `docs/shared/currentPluginStructureAnalysis.md` - Architecture reference
- `.kiro/steering/design-tokens.md` - Complete design token reference

---

## ✅ Design Completion Checklist

- [ ] Color palette swatches created in Penpot
- [ ] Typography styles defined and applied
- [ ] All SVG icons imported and organized
- [ ] Button components created with all states
- [ ] Section header component built
- [ ] Bookmark item component designed
- [ ] Quick Actions Bar assembled
- [ ] Tags Section completed (collapsed & expanded states)
- [ ] Anchors Section completed (with null state)
- [ ] Controls Section completed (all three grids)
- [ ] Full plugin layout assembled
- [ ] Responsive variants created (200px, 240px, 360px widths)
- [ ] Accessibility annotations added
- [ ] Developer handoff documentation generated
- [ ] CSS exported for implementation reference

---

*Blueprint Version: 1.0*  
*Created: December 2024*  
*For: Penpot MCP Design Development*  
*Base: stratusHue Figma Plugin v1.0.0*

