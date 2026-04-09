---
id: rel
category: meta
title: TSK — Cut a release
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
