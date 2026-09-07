---
id: set
category: navigate
title: Polish settings overlay layout and accessibility
type: task
priority: 2
status: closed
depends_on: []
created: '2026-06-22'
---

## Description

Clean up the settings overlay so it reads as a single coherent panel instead of a
stack of cramped controls. The Bridge section should be surfaced earlier, the
editing defaults area needs clearer grouping, and small-width layouts must avoid
horizontal overflow.

## Done

- Bridge moved to the top of Settings and grouped with appearance controls
- Overlay fills the available panel space with explicit outer/inner padding
- Editing Defaults reorganized into grouped cards with cleaner spacing
- Date Tagger segmented controls upgraded to accessible radiogroup behavior with
  keyboard support
- Small-width responsive rules added so nudge and date controls stack cleanly
