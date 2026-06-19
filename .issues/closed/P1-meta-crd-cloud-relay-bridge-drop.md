---
id: crd
category: meta
title: "Cloud relay bridge drops: one-time-code reconnect clobber + no keepalive"
type: bug
priority: 1
status: open
depends_on: []
created: 2026-06-19
---

## Symptom

stratusHue [dev] cloud bridge (claude.ai pairing) connects, works for one command,
then drops within seconds and never recovers — "flickers orange then stays grey."
Local (localhost ports 9223-9232) bridge unaffected.

## Root cause (verified live 2026-06-19)

Relay = southleft figma-console-mcp, a Cloudflare Durable Object
(`figma-studio/src/core/cloud-websocket-relay.ts`), paired via `/ws/pair?code=`
(`figma-studio/src/index.ts:1076`).

1. **One-time pairing-code clobber (dominant).** Code deleted from KV on first connect
   (`index.ts:1097`). `bridge-client.ts` auto-connected to a stored (consumed) code on
   load AND auto-reconnected on close; `connectToCloud()` closes the existing socket
   before each attempt → the live socket is killed ~2-5s after a successful manual pair,
   then a 404 reconnect loop. Confirmed: drop timed at ~2-5s after a plugin relaunch.
2. **Idle close, no keepalive.** Relay sets no `setWebSocketAutoResponse`; no client
   heartbeat → Cloudflare closes the idle hibernatable socket after tens of seconds.

FILE_INFO / `figma.fileKey` was **NOT** the cause — the relay only stores FILE_INFO and
never gates on it (ruled out live: valid fileKey, still dropped).

## Fix (implemented + verified)

`src/ui/bridge/bridge-client.ts`:
- [x] Remove cloud auto-connect-on-load (`initBridgeClient` no longer connects a stored code)
- [x] Remove cloud auto-reconnect (one-time codes can't be reused; on drop → disconnected, re-pair)
- [x] Add 20s keepalive PING on the cloud socket (`startCloudKeepalive` / `stopCloudKeepalive`)
- [x] Tests: `src/test/bridge-client.test.ts` (+4; 328 total green), type-check + lint clean
- [x] Live re-verify: survived ~3m37s pure-keepalive idle, no early clobber

Connection re-verified live on **claude.ai itself** (2026-06-19): it paired, stayed
connected, and served data over the cloud relay. (The user's separate
`figma_get_variables` failure that day was unrelated — they were on a FigJam board,
which has no Variables API; see memory note.)

## Remaining
- [x] Connect-button feedback text ("Connecting… / Connected / Failed") — commit `f6d230d`
      (status line in `ui.html`/`styles.css`, `cloudStatusLabel` unit-tested in `bridge-ui.test.ts`).
- [x] Commit on `feature/desktop-bridge-dev` — `b492a0d` (fix) + `f6d230d` (feedback).
- [ ] Eyeball-confirm the status text renders in the live plugin UI.
- [ ] Push to remote.
- [ ] ⚠️ Do NOT merge this branch's `manifest.json` to `main` — it is the dev manifest
      (relay domains whitelisted). `main` must keep the locked-down `networkAccess: none`
      prod manifest.

## Relay-side follow-up (figma-studio, optional but better)
- Add `setWebSocketAutoResponse` ping/pong so the DO keeps idle sockets warm without
  waking, and/or issue a reusable session token so a genuine drop can re-attach without
  a fresh manual pairing.
