---
type: context
tags: [bridge, cloud-relay, figma-console-mcp, debugging, meta]
created: 2026-06-19
---

# Cloud relay bridge: why it dropped, and how the pieces fit

Hard-won during a live debugging session (claude.ai couldn't keep a cloud bridge
connection). Issue `crd`. Non-obvious cross-repo facts worth keeping:

## The relay (lives in the figma-studio repo, not stratusHue)
- Cloud relay = **southleft figma-console-mcp**, a **Cloudflare Durable Object**:
  `~/Projects/figma-studio/src/core/cloud-websocket-relay.ts` (+ pairing route in
  `src/index.ts:1076`). The local server is `src/core/websocket-server.ts`.
- The canonical plugin it was ported from: `figma-studio/figma-desktop-bridge/`
  (`ui-full.html` is the working reference client).
- Pairing codes are **one-time use** — deleted from KV on first connect
  (`index.ts:1097`). They expire in 5 min and cannot be reused on reconnect.
- The relay uses **hibernatable WebSockets with no `setWebSocketAutoResponse`** —
  an idle socket gets closed by Cloudflare after tens of seconds. No server keepalive.
- The relay only **stores** FILE_INFO; it does NOT gate the connection on it. The old
  `ver` assumption (FILE_INFO handshake must match `initializeConnection`) was a red herring.

## stratusHue bridge-client bugs (fixed)
1. Auto-connecting to a saved (consumed) pair code on load + auto-reconnecting on close
   reused a one-time code → 404, and `connectToCloud()` closes the live socket first, so
   a stale reconnect timer **clobbered a freshly paired socket ~2-5s later**. Removed both.
2. No client keepalive → idle close. Added a **20s PING** on the cloud socket
   (`startCloudKeepalive`). Verified live: survived ~3m37s idle.

## Repo locations (the session's wrong-path: docs said `~/Documents/GitHub/...`)
- All these repos live under **`~/Projects/`** (stratusHue, figma-studio, rive-studio,
  groundControl), NOT `~/Documents/GitHub/`. The figma-kb routing-reference doc's old path
  is stale.

## FigJam gotcha (unrelated red herring during the session)
- On a **FigJam board** `figma.variables` is `undefined`, so `figma_get_variables` fails
  with a misleading "Desktop Bridge not available". It's not a bridge fault — FigJam has no
  Variables API. `figma_execute` and board reads work fine over the same connection.

## Diagnostic technique that worked
- From a Claude Code cloud session you can call `figma_pair_plugin` to get a code, have the
  user paste it into stratusHue's Cloud Mode, then drive `figma_execute` to inspect the
  real runtime — isolates relay vs client vs file-type without guessing.
