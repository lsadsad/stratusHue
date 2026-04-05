---
id: anc
category: navigate
title: BUG — Anchors list accepts max entries but doesn't display or persist them
type: bug
priority: 2
status: open
depends_on: []
created: 2026-03-29T00:00:00.000Z
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
