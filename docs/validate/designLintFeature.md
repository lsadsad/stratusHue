# Design Lint Feature

## Overview
A built-in design linting system that finds and fixes missing styles, hardcoded values, and inconsistencies in Figma designs. Reverse-engineered from the open-source [design-lint plugin](https://github.com/destefanis/design-lint) and enhanced with token validation and component health checking.

## Implementation Date
March 2026

## Strategic Context

### The Three Modes of stratusHue

Design Lint lives under the **Validate** mode — one of three operational modes that define stratusHue's product identity:

| Mode | When | Question | Value |
|------|------|----------|-------|
| **Scaffold** | Project start | *Is the file structured correctly?* | Eliminates template duplication |
| **Navigate** | During work | *Where am I? What's next?* | Speed and orientation |
| **Validate** | Before handoff | *Is it correct and complete?* | Confidence at delivery |

```
SCAFFOLD (project start)
  ├── Template recipes (configurable per team)
  ├── Page structure builder
  └── Project type selector

NAVIGATE (during work)
  ├── Bookmarks & Anchors
  ├── Navigation History (back/forward)
  ├── Layer Hierarchy (enter/exit/siblings)
  ├── Emoji Tags (color coding)
  ├── Date Tags
  ├── Sizing Modes (hug/fill/fixed)
  ├── Styled Text (content team workflow)
  └── Movement & Zoom

VALIDATE (before handoff)
  ├── Design Lint (style/token/component)  ← this feature
  ├── Readiness Check (future)
  └── Delivery Checklist (future)
```

Scaffold and Validate are mirrors — Scaffold creates the file structure from a recipe, Validate verifies it's still intact and compliant. They share the same underlying recipe format.

See also: `docs/scaffold/scaffoldMode.md` for the Scaffold concept.

## Architecture

### Mode Toggle System
The plugin operates in three modes, toggled via footer buttons. The initial implementation adds the **Validate** mode alongside the existing features (which become **Navigate** mode). Scaffold mode is planned for future implementation.

Both modes share the footer, settings overlay, theme system, and tooltip infrastructure. Two `<main>` blocks in the DOM are toggled via `display: none/block`. The active mode persists across sessions via `clientStorage`.

### Three Planned Views (Phase 1: Error List only)

#### Error List View (Phase 1)
Classic style linting grouped by error category. Finds nodes with visible fills, strokes, text, effects, or border radii that are missing a named style. Errors can be filtered by category, fixed in bulk, or ignored.

#### Token Audit View (Phase 2 — future)
Checks for hardcoded values that should use Figma variables/tokens. Reports coverage percentage and suggests matching tokens for colors, spacing, typography, and corner radius values.

#### Component Check View (Phase 3 — future)
Validates component usage: detects detached components, flags instances from unapproved libraries, and identifies outdated instances whose main component has been updated.

---

## What Will Be Added (Phase 1)

### 1. New Files

| File | Purpose |
|------|---------|
| `src/core/lint-types.ts` | Type interfaces: `LintError`, `LintCategory`, `LintStyleMatch`, `LintSettings`, `IgnoredErrorEntry`, `SavedLibrary`, message types |
| `src/core/lint-state.ts` | State management: plugin mode, error cache, ignored errors (per-document), lint settings, saved libraries |
| `src/features/lint-engine.ts` | Core scan orchestrator: async tree walker, `runLintScan()`, `applyStyleFix()`, `saveCurrentStylesAsLibrary()` |
| `src/features/lint-checks.ts` | Five check functions: `checkFills()`, `checkStrokes()`, `checkText()`, `checkEffects()`, `checkRadius()` |
| `src/features/lint-styles.ts` | Style resolution with caching. Priority: remote styles on page -> local styles -> saved libraries |
| `src/ui/lint-ui.ts` | Vanilla TS DOM rendering: error list, filter pills, batch actions, progress bar, null state |

### 2. UI Components (ui.html)
- Mode toggle button in footer
- Lint status header with error count badge and refresh button
- Filter pills: All, Fill, Text, Stroke, Radius, Effects
- Batch action bar: Select All, Fix All, Ignore All
- Error list container (populated dynamically)
- Progress bar with phase labels
- Success null state
- Lint settings section in settings overlay (category toggles, border radius values, library management)

### 3. Plugin Logic (code.ts)
- ~15 new message handlers in switch statement (all via lazy `await import()`)
- Lint state loading in `initializePlugin`
- Auto-scan triggered on entering lint mode

### 4. Live Updates (validation.ts)
- Extended `handleDocumentChange` with debounced lint re-scan (1s debounce, only in lint mode)

---

## Technical Details

### Linting Engine

#### Node Type -> Check Routing
| Node Type | Checks |
|-----------|--------|
| FRAME, RECTANGLE, INSTANCE, COMPONENT | fills, strokes, radius, effects |
| TEXT | text style, fills, effects, strokes |
| ELLIPSE, POLYGON, STAR | fills, strokes, effects |
| LINE | strokes, effects |
| GROUP, SLICE | skip (no lintable properties) |

#### Skip Conditions (no error created)
- `node.locked` — propagates to all children
- `node.visible === false`
- `boundVariables` exists for the property (properly tokenized)
- `styleId` is a `symbol` (mixed values across segments)
- `fillStyleId !== ""` (style already applied)
- Fill type is IMAGE or VIDEO

#### Error Identity
Unique key: `${nodeId}::${category}::${value}`
Used for deduplication and ignore mechanism.

#### Style Matching Priority
1. **Remote styles** already in use on the current page (discovered via `findAllWithCriteria`)
2. **Local styles** in the current file (`getLocalPaintStylesAsync`, etc.)
3. **User-saved libraries** (serialized styles from other files, persisted in `clientStorage`)

### Message Flow

#### Entering Lint Mode
```
User clicks mode toggle
  -> UI sends 'set-plugin-mode' { mode: 'lint' }
  -> Sandbox persists mode, loads ignored errors, refreshes style cache
  -> Async tree walker scans all nodes (yields every 500 for responsiveness)
  -> Progress callbacks sent to UI ('lint-progress')
  -> Batch style matching (10 at a time, 3ms delays)
  -> Final results sent to UI ('lint-results')
  -> UI renders error list
```

#### Fixing an Error
```
User clicks "Fix" on an error
  -> UI sends 'lint-fix-error' { errorId, styleId }
  -> Sandbox applies style to node (fillStyleId, strokeStyleId, etc.)
  -> documentchange fires -> debounced re-scan -> updated results
  -> Error disappears from list automatically
```

#### Ignoring an Error
```
User clicks "Ignore"
  -> UI sends 'lint-ignore-error' { errorId }
  -> Sandbox adds to ignored map, persists to clientStorage (per-document UUID key)
  -> UI receives updated ignored list, filters error from display
```

### Ignore System
- Per-document storage via UUID generated in `figma.root.pluginData('lintIgnoreKey')`
- Ignored error IDs stored at `clientStorage` key `lintIgnored::${uuid}`
- Full error set kept in memory, filtering done client-side for instant toggle

### Performance
- **Async generator**: Yields every 500 nodes with `setTimeout(resolve, 0)` to prevent UI freezes
- **Style cache**: 10-second TTL to avoid redundant style API calls during rapid re-scans
- **Batch matching**: Style matches processed in batches of 10 with 3ms delays
- **Debounced re-scan**: `documentchange` triggers re-scan after 1s debounce
- **Skip invisible**: `figma.skipInvisibleInstanceChildren = true` prunes the tree
- **Lazy imports**: All lint modules loaded via `await import()` — zero cost in Organize mode
- **DOM fragments**: Error list uses `DocumentFragment` to minimize reflows

### Settings
- **Category toggles**: Enable/disable individual check types (fill, stroke, text, effects, radius)
- **Allowed border radii**: Configurable comma-separated list (default: `0, 2, 4, 8, 16, 24, 100`)
- **Library management**: Save current file's styles as a named library, remove saved libraries

---

## Features

### Core Functionality
- [ ] Mode toggle between Organize and Lint views
- [ ] Auto-scan on entering lint mode
- [ ] Live updates via documentchange listener
- [ ] Five lint check types: fills, strokes, text, effects, border radius
- [ ] Style matching with remote -> local -> library priority
- [ ] Filter pills for error category filtering
- [ ] Error count badge
- [ ] Progress bar during scanning

### Actions
- [ ] Select — navigate to and select the errored node in Figma
- [ ] Fix — apply the best matching style to the node
- [ ] Ignore — hide error from list, persisted per-document
- [ ] Select All — select all nodes with errors (filtered by category)
- [ ] Fix All — apply matching styles to all fixable errors
- [ ] Ignore All — ignore all visible errors

### Settings
- [ ] Per-category enable/disable toggles
- [ ] Custom border radius allowed values
- [ ] Save/load/remove style libraries

### Accessibility
- [ ] ARIA roles on filter pills (`tablist`/`tab`)
- [ ] ARIA labels on all buttons
- [ ] Role `list`/`listitem` on error list
- [ ] Keyboard navigation support
- [ ] Screen reader announcements for scan completion

---

## Future Phases

### Phase 2: Token Audit View
- Scan for hardcoded values not bound to Figma variables
- Coverage summary (% tokenized vs hardcoded)
- Smart matching to nearest token
- Filter by token category: Color, Spacing, Typography, Radius

### Phase 3: Component Check View
- Detect detached components (FRAMEs with component-like names)
- Flag instances from unapproved libraries
- Identify outdated instances
- Configurable approved library list
