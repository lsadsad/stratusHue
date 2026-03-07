# stratusHue Roadmap

## Current Baseline (March 2026)

| Metric | Value |
|---|---|
| Total source lines | ~22,300 |
| `code.ts` | 1,518 lines, 65 message handlers |
| `ui.ts` | 4,890 lines (monolith) |
| `styles.css` | 7,256 lines |
| `navigation.ts` | 3,472 lines (largest module) |
| Built `ui.html` | 425 KB (inlined CSS + JS + base64 assets) |
| Built `code.js` | 196 KB |

Dynamic imports are already used in `code.ts` (16 lazy imports). `ui.ts` has no code splitting.

---

## Three-Mode Product Model

| Mode | When | Purpose | Status |
|---|---|---|---|
| **Navigate** | During work | Bookmarks, history, emoji tags, sizing, movement | Shipped |
| **Validate** | Before handoff | Design Lint, readiness checks, delivery checklists | Phase 1 specced |
| **Scaffold** | Project start | Template recipes that build file structure | Concept only |

Scaffold and Validate are mirrors — one creates structure from a recipe, the other audits against it.

---

## Implementation Phases

### Phase 1: Styled Text

**Mode**: Navigate (new collapsible section in Controls)
**Scope**: 4 files modified, ~400 new lines
**Spec**: `docs/features/STYLED_TEXT_FEATURE.md`

Two buttons — Paste Styled (clipboard HTML to Figma TextNode) and Copy Styled (Figma TextNode to clipboard HTML). Runs entirely on-demand when the user clicks a button. No background work, no scanning, no new modes.

**Performance risk**: Low. HTML parsing and font loading happen per-action only.

**Prerequisite**: None.

### Phase 1.5: Refactor ui.ts into mode modules

**Scope**: Internal restructuring, no user-facing changes
**Spec**: `docs/features/UI_SPLIT_REFACTOR.md`
**Goal**: Split the 4,890-line `ui.ts` monolith before Lint adds another ~800+ lines

Target structure:
```
src/ui.ts                        -> slim shell (~800 lines): mode router, dispatcher, shared init
src/ui/shared/                   -> tooltip, theme, a11y, layout, cleanup, lottie
src/ui/navigate/                 -> all current Navigate mode DOM + handlers (~2,200 lines)
src/ui/lint/lint-ui.ts           -> Lint mode rendering (created in Phase 2)
src/ui/scaffold/scaffold-ui.ts   -> Scaffold mode rendering (created in Phase 3)
```

The shell lazy-imports mode modules only when the user activates that mode, matching the `await import()` pattern `code.ts` already uses. Lint UI code never loads if the user stays in Navigate mode. Navigate loads eagerly since it's the default mode.

**Performance risk**: None — this is the performance mitigation.

**Prerequisite**: Phase 1 complete (so Styled Text can be extracted as the first split).

### Phase 2: Design Lint — Error List (Validate Phase 1)

**Mode**: Validate (introduces mode toggle system)
**Scope**: ~6 new files, ~1,200-1,500 new lines, ~15 new message handlers
**Spec**: `docs/features/DESIGN_LINT_FEATURE.md`

Introduces the Navigate/Validate mode toggle in the footer. Scans visible nodes for missing styles across five categories (fills, strokes, text, effects, border radius). Errors can be filtered, fixed, or ignored.

**Performance risk**: High — the async tree walker scans every visible node. Mitigations:

| Concern | Mitigation |
|---|---|
| Large file scan cost | Node count check — show manual "Scan" button above threshold (~5K nodes) |
| Scan scope | Current page only, not all pages |
| Edit churn re-scans | `documentchange` debounce at 2s (not 1s as specced) |
| Wasted scans | Cancel in-flight scan when user switches back to Navigate |
| Style API spam | 10s TTL cache on style lookups |
| UI thread blocking | Async generator yields every 500 nodes |

Also requires splitting `code.ts` message dispatch:
```typescript
if (msg.type.startsWith('lint-')) {
  const { handleLintMessage } = await import('./features/lint-dispatch');
  return handleLintMessage(msg);
}
```

**Prerequisite**: Phase 1.5 (ui.ts split), mode toggle infrastructure.

### Phase 3: Scaffold

**Mode**: Scaffold (third mode in footer toggle)
**Scope**: TBD — concept only, needs full spec
**Spec**: `docs/features/SCAFFOLD_MODE.md`

Configurable JSON recipes that define project file structure. User selects a recipe, toggles optional pages, clicks Build. The same recipe format feeds Validate's future Readiness Check.

**Performance risk**: Low. Page creation is a one-time operation. Recipe storage/loading from `clientStorage` should be lazy.

**Open questions** (must resolve before speccing):
- Recipe storage: `clientStorage` (per-user) vs `pluginData` (per-file) vs external?
- Should recipes include page content templates or just names/structure?
- Recipe updates: re-scaffold adds missing pages, or just flag in Validate?
- Accessible from empty files only, or also mid-project?

**Prerequisite**: Phase 2 (mode toggle system exists).

### Future: Validate Phase 2 & 3

- **Token Audit View**: Hardcoded values not bound to Figma variables. Coverage percentages.
- **Component Check View**: Detached components, unapproved libraries, outdated instances.
- **Readiness Check**: Recipe-based structure audit (uses Scaffold recipes).

These are post-Scaffold and depend on the recipe format being finalized.

---

## Performance Principles

1. **Zero-cost modes**: UI and sandbox code for inactive modes must never load. Use `await import()` everywhere.
2. **No auto-scan on large files**: Any feature that walks the node tree must gate on node count and offer a manual trigger.
3. **Current page only**: Node scanning defaults to `figma.currentPage`, never the full document.
4. **Cancel on mode switch**: In-flight async work (scans, batch fixes) must be cancellable.
5. **DOM population on activation**: Mode `<main>` blocks start empty and populate via JS when activated. Keeps initial HTML parse cheap.
6. **Message dispatch by prefix**: New feature message handlers use prefixed routing (`lint-*`, `scaffold-*`) with lazy-imported dispatchers, not more cases in the main switch.

---

## Feature Directory

| Location | Contents |
|---|---|
| `docs/features/` | stratusHue feature specs (Navigate, Validate, Scaffold) |
| `docs/standalone/` | Separate plugin concepts not part of stratusHue's mode system |
| `docs/ROADMAP.md` | This file — phased plan and performance strategy |

See `docs/features/README.md` for the feature index.
