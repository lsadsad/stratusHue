# Recursive Emoji Tagging

**Date:** 2026-03-27
**Mode:** Navigate
**Status:** Approved design

## Summary

Add Shift+click modifier to emoji buttons and the clear button in Navigate mode. When Shift is held, the emoji operation applies recursively to the selected node and all its descendants, making tagged subtrees visually distinct throughout the Figma layer hierarchy.

## Behavior

### Shift + Emoji Click
- Tags the selected node and every descendant with the chosen emoji
- Replaces any existing emoji on every node (uniform tree)
- No depth limit or node count safeguard

### Shift + Clear
- Strips emojis from the selected node and all descendants
- No selective filtering — removes all emojis regardless of which emoji each node has

### Empty Selection
- Recursive variants require at least one selected node — if selection is empty, no-op with notify "Select a layer to tag recursively"
- Does NOT fall back to page-level behavior (the non-recursive path handles that)

### Scope
- Layers only (pages have no tree structure)
- Operates on `figma.currentPage.selection`

## Implementation

### Approach: New Message Types

Two new message types keep the recursive path isolated from existing emoji logic.

### Touch Points

| File | Change |
|---|---|
| `src/ui/navigate/anatomy.ts` | Shift detection on emoji button click — send `'add-emoji-recursive'` |
| `src/ui/navigate/navigate-ui.ts` | Shift detection on clear button click — send `'clear-emoji-recursive'` |
| `src/core/types.ts` | Add `'add-emoji-recursive'` and `'clear-emoji-recursive'` message types |
| `src/code.ts` | Two new dispatch cases + handler functions wrapped with `withErrorBoundary()` |
| `src/features/emoji-manager.ts` | `addEmojiToSelectionRecursive()`, `clearEmojiFromSelectionRecursive()`, `walkDescendants()` helper |

### 1. UI Layer — Shift Detection

In `anatomy.ts`, the emoji button click handler checks `event.shiftKey`. If held, sends `'add-emoji-recursive'` instead of `'add-emoji'` with the same `{ emoji }` payload.

Same pattern for the clear button in `navigate-ui.ts` — Shift+click sends `'clear-emoji-recursive'` instead of `'clear-emoji'`.

No new buttons, toggles, or visual indicators.

### 2. Message Types

```typescript
'add-emoji-recursive'    // payload: { emoji: string }
'clear-emoji-recursive'  // payload: none
```

Dispatched in `code.ts` alongside existing `'add-emoji'` / `'clear-emoji'` cases.

### 3. Sandbox Logic — Tree Walker

In `emoji-manager.ts`:

**`walkDescendants(node: SceneNode, fn: (n: SceneNode) => void): void`**

Inline recursive walk that applies the operation as it traverses — no intermediate array allocation:

```typescript
function walkDescendants(node: SceneNode, fn: (n: SceneNode) => void): void {
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      fn(child);
      walkDescendants(child, fn);
    }
  }
}
```

**`addEmojiToSelectionRecursive(emoji: string)`**
- Gets `figma.currentPage.selection`
- For each selected node: applies `replaceColorEmoji` to the node itself, then to all descendants via `walkDescendants()`
- Skips locked descendants (node.locked === true) — counts them separately
- Updates bookmarks only for the root selected nodes (not every descendant — avoids hundreds of async lookups)
- Returns `{ success: boolean; message: string; count: number }`

**`clearEmojiFromSelectionRecursive()`**
- Same tree-walking pattern with `walkDescendants()`
- Applies `removeEmojiPrefix` to every unlocked node in the subtree
- Returns same result shape

### 4. Post-Operation

`updateUIAfterEmojiChange()` is called after completion — same as existing flow. Notify message reflects total count, e.g. "Tagged 47 layers with 🟥" or "Cleared emoji from 23 layers".

No new sandbox-to-UI messages needed.

## Decisions

- **No depth/count guardrails:** Applies unconditionally regardless of descendant count
- **Replace, don't skip:** Existing emojis on descendants are overwritten
- **No selective clear:** Shift+clear removes all emojis, not just matching ones
- **Locked descendants skipped:** Locked nodes are not renamed — count is reported in notify (e.g., "Tagged 45 layers with 🟥 (2 locked layers skipped)")
- **Empty selection = no-op:** Recursive variants do not fall back to page-level tagging
- **Bookmark updates batched:** Only root selected nodes trigger bookmark updates, not every descendant
- **Handlers wrapped with `withErrorBoundary()`** per project convention
