---
id: trs
category: meta
title: "Re-sync Throughline companion files from figma-studio canonical"
type: task
priority: 4
status: open
depends_on: []
created: 2026-06-07
---

## Purpose

`CLAUDE-throughline.md` and `CLAUDE-visual-craft.md` are **downstream verbatim copies** of figma-studio's Throughline operating layer. figma-studio is the canonical source — edits happen there. This issue tracks the obligation to re-sync when figma-studio's Throughline layer advances past the version copied here.

## Current copy version

- Source: `~/Documents/GitHub/figma-studio/CLAUDE.md` (lines 1–211) + `CLAUDE-visual-craft.md`
- Copied at: figma-studio Throughline **v4.17 / May 18 2026**

## Re-sync procedure

1. `sed -n '1,Np' ~/Documents/GitHub/figma-studio/CLAUDE.md > CLAUDE-throughline.md` where `N` is the last line before figma-studio's `# Figma Console MCP` dev-docs header (was 211 — re-check, it drifts).
2. `cp ~/Documents/GitHub/figma-studio/CLAUDE-visual-craft.md CLAUDE-visual-craft.md`
3. Re-apply the local header edit on `CLAUDE-throughline.md` line 1 (the "Downstream copy…" note — `sed`/`cp` overwrites it).
4. Verify the `@CLAUDE-visual-craft.md` import line survives (was line 40).
5. Confirm the scoped guardrail section in `CLAUDE.md` still matches the imported content (named collisions: 4pt grid, Notion DD, figma-studio-only nouns).

## Notes

- Verbatim by design — do **not** adapt the AT&T content; the scope guardrail in `CLAUDE.md` handles applicability.
- See `.memory/2026-06-07-throughline-port.md` for the full rationale.
