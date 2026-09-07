---
id: rel
category: meta
title: "Cut a release — version check, changelog, comms"
type: task
priority: 2
status: open
depends_on: []
created: 2026-03-29
---

## Description

Ship a release even though Validate is still in progress. The plugin is at `1.4.2` — decide on the next version, prepare release notes, and address comms (what to communicate, to whom, and how).

## Checklist

- [ ] Decide version bump (patch vs minor — Validate is WIP but Navigate improvements have landed)
- [ ] Review changelog since last release (`git log` from last tag)
- [ ] Write release notes — what's new, what's improved, what's coming
- [ ] Comms plan: who needs to know, what channel (Figma Community description, team Slack, etc.)
- [ ] Update `package.json` version
- [ ] Tag the release
- [ ] Publish to Figma Community (if applicable)

## Context

Validate mode is still under development but Navigate has accumulated enough changes (shortHand phrases, emoji anchors, etc.) to warrant a release. Comms should set expectations — highlight what's shipping now and tease what's next.

## Version drift found during the main sync (2026-09-06)

Numbering is inconsistent across branches — resolve before picking the next version:

| Branch | `package.json` | Note |
|---|---|---|
| `main` | `1.4.2` | after the desktop-bridge sync, content is the newest |
| `feature/desktop-bridge-dev` | `1.4.2` | |
| `develop` | `1.5.0` | tagged `release: stratusHue v1.5.0 — Validate mode early preview` (`5303116`), last commit 2026-06-07 |

`develop`'s 1.5.0 shipped the Validate/Design Lint mode that `704ea67` later removed. So a
released 1.5.0 exists whose headline feature is gone, and `main` now carries newer work under
a lower number. Options: burn 1.5.x and cut `main` as **1.6.0**, or re-cut 1.5.0 from `main`
if the earlier tag never actually reached the Community listing — check the listing first.

Two more things to catch in the same pass:

- `PLUGIN_VERSION` in `src/features/bridge/file-info.ts` is a hardcoded `'1.4.2'` and does not
  read `package.json`. It goes out over the bridge FILE_INFO handshake — bump both or wire it up.
- There is no `CHANGELOG.md` in the repo. The checklist item "review changelog since last
  release" has no file to review; `git log` between tags is the only source.

Also open: whether `develop` is retired or reconciled. It is ~3 months behind and represents
the abandoned Validate line.

## Version decided (2026-09-07): 1.6.0

`main` goes 1.4.2 → **1.6.0** directly. Reasoning:

- **1.5.0 cannot be reused.** It shipped — tag `v1.5.0`, `docs/releases/v1.5.0.md`, and commit
  `d23c425` "v1.5.0 released — Figma Community update". Users have it installed.
- **Not 2.0.0.** The only thing 1.5.0 users lose is the Validate tab, which its own release notes
  called "a preview". Withdrawing an explicitly provisional feature is not a broken promise, and an
  end-user plugin has no API contract to break.
- **No other regressions.** Verified `comm`-diff of `git ls-tree v1.5.0 src/` against `main`: every
  non-lint source file in v1.5.0 is present on `main`. Recursive emoji tagging
  (`add-emoji-recursive` / `clear-emoji-recursive`) and sticky headers spot-checked directly.

Done in this pass: `package.json` and `PLUGIN_VERSION` in `src/features/bridge/file-info.ts` both
bumped to 1.6.0; `docs/releases/v1.6.0.md` drafted; `docs/releases/v1.5.0.md` carried onto `main`
(it only ever existed on `develop`).

Still open on this issue: tag the release, publish to Figma Community, and the comms plan.

⚠️ **Blocked by `btg`** — the bridge toggle ships visible but non-functional in the Community build.
Resolve before publishing.
