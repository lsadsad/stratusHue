---
type: decision
tags: [bridge, mcp, at&t, publish, build, meta]
created: 2026-07-24
---

# MCP bridge stays out of the Community/AT&T build — two build flavors instead

Considered adding an MCP bridge toggle to the published/AT&T-approved stratusHue build so teammates
could use it without a separate plugin import. Decided against changing the published surface.

## Why

- MIT licensing (figma-console-mcp is MIT) is not the constraint — copying/porting bridge code is
  legally fine and already done (`src/features/bridge/`).
- The real constraint is **review scope**: stratusHue was AT&T-approved as a locked-down plugin
  (`networkAccess: none`). Folding in a remote-control bridge (`EXECUTE_CODE`, etc.) changes what
  the *approved* plugin can do, independent of whether figma-console-mcp itself is separately
  allowed on the org list. "MCP is allowed" ≠ "OK to fold MCP into this other approved plugin."
- Teammate need (the actual motivating reason) doesn't require touching the Community build —
  it's a distribution problem, solved by handing teammates a separate prebuilt package.

## Decision

Ship two build flavors from one source, discriminated by a build-time flag (`__BRIDGE__`, driven by
`STRATUSHUE_BRIDGE` env var) — **not** `NODE_ENV`, because the teammate package is itself a
minified/production build; a `NODE_ENV`-keyed flag would hide the bridge in exactly the build that
needs it.

- **Community** (`build` / `build:prod` / `ship`): `__BRIDGE__=false` → bridge modules tree-shaken
  out via esbuild DCE, bridge HTML stripped, `manifest.prod.json` unchanged (`networkAccess: none`).
  A post-build assertion greps the output for bridge markers and fails the build if any survive —
  this is the actual guarantee, not just "UI hidden."
- **Team** (`build:team` / `pkg:team`): `__BRIDGE__=true` → bridge present, new `manifest.team.json`
  (name `stratusHue (MCP)`, localhost + cloud-relay `networkAccess`, `capabilities: ["inspect"]`).
  Distributed as a hand-delivered zip (Figma → Plugins → Development → Import plugin from manifest),
  not via npm/repo access. Dev-import convenience for teammates (running from source) explicitly
  deferred as a later option, not in this scope.

Full design: `docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md`
Tracking issue: `.issues/open/P2-meta-bfl-mcp-bridge-compile-out-flavors.md`

## Open question caught during review

`CLAUDE.md` / `AGENTS.md` / `.cursor/rules/*.mdc` currently have **zero mentions** of the bridge
subsystem at all — not just the new flavors, the bridge itself was never documented where an AI
agent's always-loaded context would find it. Without a `CLAUDE.md` entry, a future agent asked to
"package a build for teammates" has no discovery path short of grepping source or closed issues.
Added as an explicit scope item in the `bfl` issue (new "Bridge & Build Flavors" subsection +
`Commands` table entries) rather than left implicit.

## Status

Design complete and approved. Spec + tracking issue written, not yet implemented. Next step is
`writing-plans` to turn the spec into an implementation plan.
