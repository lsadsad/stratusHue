---
id: ret
category: navigate
title: FTR — Recursive emoji tagging via Shift+click
type: feature
priority: 2
status: closed
depends_on: []
created: 2026-03-27T00:00:00.000Z
---

# Recursive emoji tagging via Shift+click

Shift+click an emoji button to tag the selected node and all descendants recursively. Shift+clear strips emojis from the entire tree. Locked nodes are skipped with count reported in notify.

New message types: `add-emoji-recursive`, `clear-emoji-recursive`. Tree walker uses `walkDescendants` helper with no intermediate array allocation.
