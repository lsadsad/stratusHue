---
type: context
tags: [navigate, bookmarks, anchors, state, cache-aside, testing, mocks]
created: 2026-06-15
---

# Anchors silent-drop bug (`anc`) + bookmark persistence is now unit-testable

## What broke (root cause)

The "anchors accepted at max but not displayed / not persisted" bug (`anc`) was
**not** in the UI or message flow — that whole chain (addBookmark → persist →
`sendBookmarksToUI` → `updateBookmarksList`) was proven correct end-to-end by
reproduction. The defect was in the **cache-aside persistence layer**:

- `setBookmarks()` (`src/core/state.ts`) wrapped `figma.root.setPluginData()` in a
  `try/catch` that **swallowed** the error (`console.error` only). Figma throws from
  `setPluginData` when a node's pluginData hits its size ceiling — i.e. "the maximum
  count." The swallow turned a failed save into a fake success, and the in-memory
  cache kept the unsaved entry → the anchor showed until reload, then vanished, with
  no error surfaced.
- `addBookmark()` (`src/features/bookmarks.ts`) compounded it by mutating the shared
  cache array in place (`bookmarks.push`) **before** persistence was confirmed, so
  cache and disk diverged on failure.

## The principle worth keeping

**Cache-aside writes must surface persistence failures, not swallow them, and must
not update (or mutate) the cache until the write is confirmed.** A swallowed write
error in a cache-aside layer always produces the same signature: looks-saved,
cache-lies, vanishes-on-reload, no error. `setBookmarks` now re-throws on failure,
invalidates the cache, and caches only a defensive copy of what was actually
persisted. `addBookmark` builds a new array instead of mutating the cached reference.

## Test-infra change (affects how to write future state tests)

`src/test/setup.ts`'s `figma.root` mock **now implements `getPluginData` /
`setPluginData`** (in-memory store, reset per test). Previously it had neither —
which is why `bookmarks.test.ts` had to mock `core/state.ts` wholesale and the real
cache-aside layer had zero coverage. New tests touching bookmarks/state can now
exercise the **real** `state.ts` against the mock (see
`src/test/bookmark-persistence.test.ts`). Tests can override
`figma.root.setPluginData` per-test to simulate a write failure (the size ceiling).

## Side cleanups this session

Surfacing the write failure exposed two **pre-existing, test-only** red gates
(unrelated to `anc`, confirmed via `git stash`): `esl` (stale assertion expecting a
removed `'Select a container'` message) and `spy` (shared `vi.fn()` copied by object
spread, breaking a negative assertion). Both fixed test-side; `src/test` now 324/324.
Remaining red gates live outside `src/test` — see issues `dsa` and `pwt`.
