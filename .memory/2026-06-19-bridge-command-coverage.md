---
type: context
tags: [bridge, figma-console-mcp, figjam, commands, meta]
created: 2026-06-19
---

# Bridge command coverage: stratusHue implements a SUBSET

stratusHue's MCP bridge (`src/code.ts` dispatch → `src/features/bridge/bridge-handlers.ts`)
handles only a subset of figma-console-mcp's command set. Any method without a handler
hits the `code.ts` default case → **"Unsupported bridge command: bridge-cmd-X"**.
A connected/paired plugin does NOT mean every tool works — coverage is per-command.

- **Mapping:** bridge-client maps an incoming `METHOD` →
  `bridge-cmd-${method.toLowerCase().replace(/_/g,'-')}`. The dispatch switch in `code.ts`
  must have a matching case, wired to a handler in `bridge-handlers.ts`.
- **Reference (full command set):** `figma-studio/figma-desktop-bridge/code.js` — port from there.
  Reply with `reply(requestId, { success:true, data:{...} })` matching the reference's `data`
  shape so the server's per-tool parser accepts it.
- **Ported so far:** execute-code, file-info, variables (+collections/modes), components,
  node ops (resize/move/fills/strokes/clone/delete/rename/set-text/create-child/description/metadata),
  and (2026-06-19, issue `fjc`, commit `fb1f59c`) the **FigJam set**: board-contents, connections,
  sticky/stickies, shape-with-text, connector, section, table, code-block.
- **Still unported** (will hit "Unsupported"): **Slides** (ADD_SHAPE_TO_SLIDE, CREATE_SLIDE,
  GET_SLIDE_*), **annotations** (GET_ANNOTATIONS), DEEP_GET_COMPONENT, GET_TEXT_STYLES,
  plugin screenshot capture.
- **Universal workaround:** `figma_execute` runs arbitrary Plugin API code and is always
  available — use it for any command stratusHue hasn't ported yet. Note: on a FigJam board
  `figma.variables` is `undefined` (see [[2026-06-19-cloud-relay-bridge-drop-root-cause]]).
