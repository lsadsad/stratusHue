---
id: ver
category: meta
title: "Verify cloud relay FILE_INFO handshake live via claude.ai pairing"
type: task
priority: 3
status: open
depends_on: []
created: 2026-06-06
---

## Problem

The cloud relay FILE_INFO handshake is implemented and unit-tested (commit `8c365a3`) but has **not** been verified end-to-end against a live claude.ai pairing. Local bridge is fully verified; cloud is the one remaining unconfirmed path.

## Steps to verify

1. Enable **MCP bridge** in stratusHue [dev] (Settings toggle).
2. Start pairing in a claude.ai session to get the pairing code.
3. Enter the code in stratus **Settings → Cloud**, click Connect → confirm the `cloud` dot goes green.
4. Confirm the relay resolves the active file (name + variables) from claude.ai, same as local.

## Notes

- Cloud socket sends the **same** `FILE_INFO` as local on `ws.onopen` (relay routes it through the identical `initializeConnection` — verified in figma-studio source).
- stratus only fires Connect on **exactly 6 chars** (`bridge-ui.ts`). If the relay ever issues shorter codes, relax that check.
- Full protocol reference: figma-kb `feedback:desktop-bridge-custom-plugin-protocol`.
