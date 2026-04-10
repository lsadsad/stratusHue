---
id: anm
category: navigate
title: BUG — Anchor name doesn't update when layer is renamed
type: bug
priority: 2
status: open
depends_on: []
created: '2026-04-09'
---
## Description

Anchor names are stale after the source layer is renamed.

## Steps to reproduce

1. Select a layer and add it as an anchor
2. Rename the layer in Figma's layer panel
3. Observe the anchor list — it still shows the old name

## Expected behavior

The anchor name should update to reflect the current layer name, either reactively (via `documentchange`) or on next access.

## Notes

Likely cause: anchor data is stored with a snapshot of the layer name at creation time and never refreshed against the live node name.
