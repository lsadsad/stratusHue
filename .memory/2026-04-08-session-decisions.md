# Session decisions (2026-04-08)

- Anchors bug root cause: handleSaveBookmark used fire-and-forget updateUIAfterNavigation instead of awaited updateUIAfterBookmarkChange — one-line fix in code.ts:1179
