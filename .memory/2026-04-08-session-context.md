# Session context (2026-04-08)

- Agent investigation traced full add-anchor flow: UI save-bookmark msg → handleSaveBookmark → addBookmark → updateUIAfterNavigation (fire-and-forget) → race with selectionchange
- CLAUDE.md deduplicated — shortHand tables removed, pointer to groundControl added
