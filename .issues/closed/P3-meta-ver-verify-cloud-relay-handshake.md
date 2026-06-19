---
id: ver
category: meta
title: "Verify cloud relay FILE_INFO handshake live via claude.ai pairing"
type: task
priority: 3
status: closed
depends_on: []
created: 2026-06-06
closed: 2026-06-19
---

## Outcome (2026-06-19)

Verified end-to-end live via a cloud MCP session (figma-console-mcp `figma_execute`
over the relay). **Result: the cloud path was broken** — it connected, served one
command, then dropped within tens of seconds and never recovered. Verification
surfaced two root causes; both fixed (see issue `crd`).

## Root causes found

1. **One-time pairing code + auto-reconnect (dominant).** The relay deletes the
   pairing code from KV on first connect (`figma-studio/src/index.ts:1097`).
   stratusHue auto-connected to a stored (consumed) code on load and auto-reconnected
   on close — each retry 404s, and `connectToCloud()` closes the live socket first.
   Net: a freshly paired socket got clobbered ~2-5s later by the stale reconnect timer.
2. **No keepalive on an idle hibernatable socket.** The relay is a Cloudflare Durable
   Object with no `setWebSocketAutoResponse`; neither plugin sent a heartbeat, so the
   edge closed the idle socket after tens of seconds.

## Fix (issue `crd`)

- Removed cloud auto-connect-on-load and auto-reconnect (one-time codes can't be reused).
- Added a 20s client keepalive PING on the cloud socket.
- Re-verified live: connection survived **~3 min 37s** of pure-keepalive idle (probe at
  t0 and t+217s both succeeded).

## Note

The old assumption in this issue — "relay routes FILE_INFO through the identical
`initializeConnection`, verified in figma-studio source" — was a **red herring**. The
cloud relay (southleft `cloud-websocket-relay.ts`) only *stores* FILE_INFO; it never
gates the connection on it. fileKey was valid in the live test and the socket still
dropped.
