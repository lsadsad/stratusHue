---
id: fjc
category: meta
title: "Port FigJam bridge command handlers (fix Unsupported bridge command)"
type: feature
priority: 1
status: closed
depends_on: []
created: 2026-06-19
closed: 2026-06-19
---

## Problem

claude.ai's `figjam_*` tools failed on a FigJam board with **"Unsupported bridge
command"** — both reads and writes. Root cause: stratusHue's bridge (`code.ts`
dispatch + `bridge-handlers.ts`) implemented only a SUBSET of the Desktop Bridge
command set; FigJam commands had no handler → `code.ts` default case error.

The Desktop Bridge plugin WAS serving the board fine (`figma_execute` worked on it);
only command coverage was missing. Not a desktop-vs-browser or pairing issue.

## Fix (commit `fb1f59c`)

Ported the FigJam handlers from the reference (`figma-studio/figma-desktop-bridge/code.js`):
`GET_BOARD_CONTENTS`, `GET_CONNECTIONS`, `CREATE_STICKY`, `CREATE_STICKIES`,
`CREATE_SHAPE_WITH_TEXT`, `CREATE_CONNECTOR`, `CREATE_SECTION`, `CREATE_TABLE`,
`CREATE_CODE_BLOCK`. Result `data` shapes mirror the reference so the figma-console-mcp
server's parsers accept them. All guard on `figma.editorType === 'figjam'`. +9 smoke tests.

## Verified live (2026-06-19)

Over the cloud relay: `figjam_get_board_contents` returned the full Loyalty board
(8 sections + stickies); `figjam_create_sticky` created a GREEN sticky. Test artifacts
cleaned up. 342 tests / type-check / lint / build all green.

## Remaining (tracked under `brg` epic — NOT done)

Other command families still hit "Unsupported bridge command" and are not ported:
- **Slides** — `ADD_SHAPE_TO_SLIDE`, `CREATE_SLIDE`, `GET_SLIDE_*`, etc.
- **Annotations** — `GET_ANNOTATIONS`, `GET_ANNOTATION_CATEGORIES`
- `DEEP_GET_COMPONENT`, `GET_TEXT_STYLES`, plugin screenshot capture

Port from the reference when needed. Interim workaround for any missing command:
`figma_execute` (the always-available catch-all that runs arbitrary Plugin API code).
