---
id: dox
category: meta
title: TSK — Execute docs/ reorganization
type: task
priority: 2
status: open
depends_on: []
created: 2026-04-02T00:00:00.000Z
---

## What

Reorganize `docs/` per the approved design spec:
`docs/superpowers/specs/2026-04-02-docs-reorganization-design.md`

## Why

The docs folder has grown into a dumping ground — no clear structure, 15 top-level files, naming inconsistency (ALL_CAPS vs kebab vs camelCase), stale session micro-docs mixed with live specs, and non-doc artifacts (SQL, HTML, excalidraw) sitting at root.

## Scope

- Move files into mode-first hierarchy: `navigate/`, `validate/`, `scaffold/`, `shared/`, `dev/`
- Rename all files to camelCase
- Archive session micro-docs and v1 drafts → `archive/`
- Delete non-doc artifacts (SQL, HTML, excalidraw files)
- Delete Beads remnants: `docs/stratusHue-beads-2026-03-22.sql` and `.beads-backup-save/`
- Remove empty `features/` and `navigation/` folders after redistribution
- Update `CLAUDE.md` reference to `figmaFunctionalDebugPlaybook.md`
- Sweep all `docs/features/` cross-references in ROADMAP, issues, .github, context/, and .memory/
- ~~Update `.issues/open/P1-meta-aud-template-methodology-audit.md` output paths~~ ✓ done
- Add README.md to new top-level folders (navigate, validate, scaffold, shared, dev)

## Reference

Full file mapping (~60 moves + 6 deletes) in spec.
