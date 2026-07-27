---
id: brg
category: meta
title: Integrate Desktop Bridge into stratusHue dev build
type: feature
priority: 1
status: closed
depends_on: []
created: '2026-06-04'
---

Merge the figma-console-mcp Desktop Bridge plugin into stratusHue so a single plugin launch covers both navigation/lint workflows and the MCP bridge — instead of running two plugins simultaneously.

## Motivation

Currently requires launching two separate Figma plugins:
- **stratusHue** — navigate, lint, scaffold
- **Desktop Bridge** — MCP WebSocket bridge for AI agents (VS Code / Claude.ai)

This is unnecessary friction. Both are Figma plugins with the same architecture. The bridge is purely additive and doesn't change any existing features.

## Architecture

### Two manifests, one codebase

```
manifest.json        ← production (published to community, networkAccess: none)
manifest.dev.json    ← dev/personal import (adds bridge, inspect, network permissions)
```

Both point to the same `dist/code.js` and `dist/ui.html`. No production users are affected.

`manifest.dev.json` additions:
- `networkAccess` with `localhost` ports 9223–9232 (WS) + `wss://figma-console-mcp.southleft.com` (cloud relay)
- `capabilities: ["inspect"]`
- `enablePrivatePluginApi: true`
- `name: "stratusHue [dev]"` — visually distinct in Figma's plugin menu

### New source modules

```
src/
  ui/bridge/
    bridge-client.ts     — WS client (local port scanning + cloud relay)
    bridge-ui.ts         — status dots + pairing code UI (lazy-loaded)
  features/bridge/
    bridge-handlers.ts   — sandbox-side command handlers (EXECUTE_CODE, GET_LOCAL_COMPONENTS, etc.)
```

Bridge code is compiled into the same bundle but only activates when:
1. Running under `manifest.dev.json` (networkAccess permits connections)
2. User has bridge enabled in settings (persisted via `clientStorage`)

### UI changes

**Footer** — two small status dots (always visible when bridge enabled):
- 🟢/🟠/🔴 Local WS (VS Code / Claude Code)
- 🟢/🟠/🔴 Cloud relay (Claude.ai)

**Settings panel** — new "Bridge" section:
- Toggle: Enable bridge (off by default)
- Pairing code input + Connect/Disconnect button (for cloud relay / Claude.ai)

### Message handling

Port the full command set from Desktop Bridge `code.js`:
- `EXECUTE_CODE` — run arbitrary `figma.*` JS (escape hatch for any feature)
- `GET_LOCAL_COMPONENTS`, `GET_COMPONENT`, `INSTANTIATE_COMPONENT`
- `GET_VARIABLES`, `UPDATE_VARIABLE`, `CREATE_VARIABLE`, etc.
- `EXECUTE_CODE` covers any new features without needing explicit handlers

Events broadcast to all connected WS servers:
- `SELECTION_CHANGE`, `DOCUMENT_CHANGE`, `PAGE_CHANGE`
- `CONSOLE_CAPTURE` — sandbox console forwarding

### Build

No new build commands needed. `npm run dev` / `npm run build:prod` compile the same bundle.
Production build stays clean — bridge code is dormant unless manifest allows network.

## Connection flow

**VS Code / Claude Code (local):**
1. figma-console-mcp server starts → opens WS on port 9223 (or next available 9224–9232)
2. stratusHue [dev] plugin loads → scans all 10 ports → connects to every active server
3. Local status dot goes green

**Claude.ai (cloud relay):**
1. Ask Claude.ai to pair → `figma_pair_plugin` generates 6-char code
2. Paste code into stratusHue Settings → Bridge section → Connect
3. Cloud status dot goes green
4. Both local + cloud connections active simultaneously

## Scope

- [ ] `manifest.dev.json` with network permissions
- [ ] `src/ui/bridge/bridge-client.ts` — WS client (local port scan + cloud relay)
- [ ] `src/ui/bridge/bridge-ui.ts` — status dots + pairing code input
- [ ] `src/features/bridge/bridge-handlers.ts` — sandbox command handlers
- [ ] `src/ui/ui-communication.ts` — add bridge message types
- [ ] `src/core/state.ts` — persist bridge-enabled preference
- [ ] Footer: two status dots
- [ ] Settings: Bridge section (toggle + cloud pairing)
- [ ] Smoke tests for new sandbox message handlers

## Out of scope (production)

Production `manifest.json` stays unchanged — `networkAccess: none`. No community users are affected. Cloud mode UI only renders when running under `manifest.dev.json`.
