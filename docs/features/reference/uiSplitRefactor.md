# Phase 1.5: ui.ts Module Split

## Overview

Split the 4,890-line `ui.ts` monolith into focused modules before Design Lint (Phase 2) adds another ~800+ lines. Without this, every feature's UI code loads at startup regardless of which mode the user is in.

## Status
Specced — implement after Phase 1 (Styled Text), before Phase 2 (Design Lint)

## Goals

1. No user-facing changes — purely internal restructuring
2. Each mode's UI code loads only when that mode activates (zero-cost modes)
3. Shared infrastructure (tooltips, themes, accessibility) stays in the shell
4. New features (Lint, Scaffold) get their own modules from day one

## Current Structure

`ui.ts` is a single file with ~90 top-level functions. They break into these functional groups:

### Shared infrastructure (~2,100 lines)
Used by all modes. Must load at startup.

| Lines | Block | Functions |
|---|---|---|
| 1-50 | Constants & globals | Icon data URIs, type defs, Lottie map, section state cache |
| 65-70 | Message bus | `sendMessage()` |
| 72-90 | Canvas hint | `showCanvasHint()` |
| 92-170 | Message dispatcher | `handlePluginMessage()` — routes incoming messages |
| 171-362 | Layout & scroll | Toggle state, auto-fit height, scroll behavior |
| 363-620 | Tooltip manager | `showTooltip()`, `hideTooltip()`, `positionTooltip()`, etc. |
| 878-980 | Lottie management | `initializeLottieAnimation()`, `destroyAllLottieAnimations()`, etc. |
| 983-1100 | Plugin init | `initializePlugin()`, `requestUISectionStates()`, `restoreUISectionStates()` |
| 1657-1710 | Global hover state | `setupGlobalHoverStateManagement()` |
| 2069-2130 | Accessibility init | `initializeAccessibilityListeners()` |
| 2129-2975 | Theme system | Theme switching, preview, contrast validation, perf monitoring (~850 lines) |
| 2976-3115 | DOM ready | `handleDOMReady()` — orchestrates startup |
| 3117-3380 | Cleanup & timers | Timer tracking, event listener cleanup, `pauseNonEssentialOperations()` |
| 3835-3900 | A11y support | `setupAccessibilitySupport()`, screen reader announcements |
| 4548-4850 | A11y features | High contrast, reduced motion, contrast validation, test suite |

### Navigate mode (~2,200 lines)
Only needed when the user is in Navigate mode.

| Lines | Block | Functions |
|---|---|---|
| 620-780 | Emoji & anatomy | `resetAnatomyEmoji()`, `updateEmojiButtons()`, `parsePageTitle()`, `parseLayerName()` |
| 780-878 | Anatomy section | `updateAnatomySection()`, `updateVisibilityLockIcons()` |
| 1104-1657 | Event listeners | `setupEventListeners()` — all Navigate button handlers (~550 lines) |
| 1711-1930 | State updates | `updateUIState()`, `updateBookmarksList()`, `updateNavigationButtons()` |
| 1930-2070 | Sizing & emoji UI | `updateLayoutSizingButtons()`, `updateEmojiSetIndicator()`, auto-fit |
| 3503-3835 | Controls | `updateControlButtons()`, `updateControlsVisibility()`, `applyGroupVisibility()` |
| 3906-4530 | Controls setup | `setupControls()`, keyboard support, nudge settings, control group toggles |

### Settings (~200 lines)
Settings overlay setup (shared, but could lazy-load).

| Lines | Block | Functions |
|---|---|---|
| 4442-4530 | Settings | `setupControlsSettings()`, `setupGroupToggle()`, `setupNudgeSettings()` |

## Target Structure

```
src/
  ui.ts                        shell: ~800 lines
  ui/
    ui-communication.ts        (existing, unchanged)
    shared/
      message-bus.ts           sendMessage(), handlePluginMessage() dispatcher
      tooltip-manager.ts       tooltip system
      theme-manager-ui.ts      theme switching, preview, contrast, perf monitoring
      accessibility.ts         a11y init, high contrast, reduced motion, tests
      layout.ts                toggle state, auto-fit, scroll behavior
      cleanup.ts               timer tracking, event listener cleanup
      lottie.ts                Lottie animation management
    navigate/
      navigate-ui.ts           event listeners, controls setup, keyboard support
      anatomy.ts               emoji buttons, anatomy section, page/layer parsing
      bookmarks-ui.ts          bookmark list rendering and updates
      controls-ui.ts           control buttons, visibility, group toggles
      settings-ui.ts           controls settings, nudge settings
    lint/
      lint-ui.ts               (Phase 2 — error list, filter pills, batch actions)
    scaffold/
      scaffold-ui.ts           (Phase 3 — recipe selector, page checklist)
```

### Shell responsibilities (`ui.ts`)

After the split, `ui.ts` becomes a thin orchestrator:

```typescript
// ui.ts — shell (~800 lines)

// 1. Constants & globals (icon URIs, types, state cache)
// 2. Global error handlers
// 3. Import shared modules (message-bus, layout, lottie)
// 4. handleDOMReady():
//    - initializePlugin() (shared init)
//    - setupSharedEventListeners() (resize, theme, cleanup)
//    - initializeNavigateMode() (lazy or direct, since it's the default mode)
//    - window.addEventListener('message', dispatcher)
// 5. Mode switching:
//    async function activateMode(mode: 'navigate' | 'lint' | 'scaffold') {
//      if (mode === 'lint') {
//        const { initializeLintUI } = await import('./ui/lint/lint-ui');
//        initializeLintUI();
//      }
//      // toggle <main> blocks
//    }
```

### Message dispatcher split

The current `handlePluginMessage()` handles all message types in one function. After the split:

```typescript
function handlePluginMessage(event: MessageEvent): void {
  const msg = event.data?.pluginMessage;
  if (!msg?.type) return;

  // Shared messages (theme, section states, resize) — handled here
  if (handleSharedMessage(msg)) return;

  // Route to active mode's handler
  if (activeMode === 'navigate') {
    handleNavigateMessage(msg);
  } else if (activeMode === 'lint') {
    handleLintMessage(msg);  // lazy-imported with the lint module
  }
}
```

## Migration Rules

1. **No behavior changes.** Every function keeps its exact signature and logic. This is a move-and-wire refactor.
2. **Shared state stays in shell.** Module-level variables like `uiSectionStatesFromPlugin`, `isAutoFitEnabled`, `themeManager` remain in `ui.ts` or a shared state module. Mode modules receive them as parameters or import from a shared module.
3. **DOM queries stay local.** Each module queries the DOM elements it needs on initialization. No global element cache.
4. **Exports are init functions.** Each module exports an `initialize*()` function that sets up its DOM listeners and returns a message handler function.
5. **Theme system moves intact.** The ~850 lines of theme code become `shared/theme-manager-ui.ts` as a single unit — don't split it further.
6. **Navigate loads eagerly.** Since Navigate is the default mode, it can load synchronously on startup. Only Lint and Scaffold use `await import()`.

## Validation

After the refactor, verify:

- [ ] `npm run build` succeeds (both code.js and ui.html)
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Plugin opens in Navigate mode — all controls work identically
- [ ] Theme switching works (all 5 themes)
- [ ] Settings overlay opens and persists changes
- [ ] Tooltips appear correctly
- [ ] Section collapse/expand states persist
- [ ] Prototype (`npm run sync:prototype && npx serve prototype`) works
- [ ] Built `ui.html` size stays within ~10% of current (425 KB)
- [ ] No new console errors on startup

## Performance Expectations

| Metric | Before | After |
|---|---|---|
| `ui.ts` line count | 4,890 | ~800 (shell) |
| Startup code loaded | 4,890 lines | ~3,000 lines (shell + shared + navigate) |
| Lint UI loaded at startup | N/A (doesn't exist yet) | 0 lines (lazy) |
| Scaffold UI loaded at startup | N/A (doesn't exist yet) | 0 lines (lazy) |

The immediate win is modest — Navigate is the default mode and loads eagerly anyway. The structural win is that Phase 2 and Phase 3 add zero startup cost.
