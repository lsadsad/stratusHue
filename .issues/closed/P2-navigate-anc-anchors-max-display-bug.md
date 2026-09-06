---
id: anc
category: navigate
title: "Anchors list accepts max entries but doesn't display or persist them"
type: bug
priority: 2
status: closed
depends_on: []
created: 2026-03-29
closed: 2026-06-15
---

## Description

The anchors list allows the user to add anchors up to the maximum allowed count, but the added anchors either don't display in the UI or don't actually get added to the underlying data. The interaction suggests success (no error, no rejection) but the result is invisible.

## Symptoms

- User can trigger "add anchor" actions up to the cap without errors
- Anchors don't appear in the anchors list UI after being added
- Unclear whether the issue is on the sandbox side (not persisting/sending) or the UI side (not rendering)

## Investigation areas

- `src/features/emoji-manager.ts` — check if anchors are actually being stored
- `src/ui/navigate/anatomy.ts` → `updateEmojiButtons()` — check if the UI receives and renders the updated list
- `src/ui/ui-communication.ts` → `sendSelectionStateToUI()` — check if anchor state is sent back after mutation
- Message flow: does the sandbox send an updated anchors list after an add operation?
- Possible race: add succeeds but the UI doesn't refresh to reflect the new state

## Resolution (2026-06-15)

Root cause was in the cache-aside persistence layer, not the UI/message flow:

- `setBookmarks()` (`src/core/state.ts`) **swallowed** the `figma.root.setPluginData`
  write failure (`catch { console.error }`). Figma throws from `setPluginData` when a
  node's pluginData hits its size ceiling ("the maximum count"). The swallow turned a
  failed save into a silent success, and the in-memory cache kept the unsaved entry —
  so the anchor appeared until reload, then vanished, with no error shown.
- `addBookmark()` (`src/features/bookmarks.ts`) compounded it by mutating the shared
  cache array in place (`bookmarks.push`) before persistence was confirmed, diverging
  the cache from disk on failure.

Fix:
- `setBookmarks()` now invalidates the cache and **re-throws** on a failed write, and
  caches only what was actually persisted (defensive copy). The existing error handling
  in `handleSaveBookmark` surfaces the failure via `figma.notify` instead of failing
  silently.
- `addBookmark()` builds a new array instead of mutating the cached reference.
- Test mock `figma.root` gained `get/setPluginData` (`src/test/setup.ts`), closing the
  gap that previously forced `bookmarks.test.ts` to mock `state.ts` wholesale.

Regression coverage: `src/test/bookmark-persistence.test.ts` (real state cache-aside —
happy path + write-failure-at-max surfaces error + no phantom cache entry).
