---
id: szi
category: navigate
title: BUG — Sizing mode toggle icon doesn't reflect current state
type: bug
priority: 2
status: open
depends_on: []
created: '2026-04-09'
---
## Description

The Sizing Modes toggle button doesn't update its icon to reflect the active state. Users can't tell which of the three sizing modes is currently selected.

## Steps to reproduce

1. Open the plugin in Navigate mode
2. Click the Sizing Modes toggle to cycle through states
3. Observe the icon — it doesn't change to indicate the new state

## Expected behavior

The toggle icon should visually communicate which of the three sizing modes is active.

## Design consideration

A two-state toggle icon doesn't naturally convey three states. May need a redesign — possible approaches:
- Cycle through three distinct icons (one per mode)
- Add a small indicator/badge showing the active mode
- Use a segmented control or dropdown instead of a toggle
