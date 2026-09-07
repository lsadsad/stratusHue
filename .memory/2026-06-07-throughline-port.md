---
type: decision
tags: [meta, throughline, claude-md, figma-studio]
created: 2026-06-07
---

# Throughline methodology ported into stratusHue (scoped companion layer)

## Decisions

- **Ported figma-studio's Throughline operating layer + visual-craft companion into stratusHue.** Two new repo-root files:
  - `CLAUDE-throughline.md` — verbatim copy of figma-studio `CLAUDE.md` lines 1–211 (the Throughline layer **only**; the unrelated `# Figma Console MCP` dev docs below line 211 were deliberately excluded).
  - `CLAUDE-visual-craft.md` — byte-identical copy (`diff` clean) of figma-studio's companion. Imported by `CLAUDE-throughline.md` at its line 40 via `@CLAUDE-visual-craft.md`.
- **Import chain:** `CLAUDE.md → @CLAUDE-throughline.md → @CLAUDE-visual-craft.md`. A single `@import` in `CLAUDE.md` pulls in both, loaded every session.
- **Copy is verbatim by user choice**, AT&T context and all (Nibble Card, AT&T Relay Design System, Progressive Leasing, Notion DD, `figma-kb`, rive-studio cross-refs left intact).
- **Wired as a *scoped* import, not unconditional.** `CLAUDE.md` gained a "Design methodology — Throughline (scoped companion layer)" section with a precedence guardrail: Throughline applies **only** to Figma design-critique work; on any conflict **stratusHue's own conventions win**. Three collisions named explicitly:
  - Spacing/sizing → stratus `--spacing-*` / `--button-height-*` / `--icon-size-*` tokens, **not** Throughline's "4pt grid is non-negotiable."
  - Decision tracking → `.issues/` + `.memory/`, **not** "DD-NNN entry in Notion."
  - figma-studio-only nouns (Nibble Card, Relay DS, figma-kb, rive-studio, ASCII→HTML→Figma→Rive sequence) = inherited background, not directives.
- **Canonical-source header rewritten.** `CLAUDE-throughline.md` line 1 now reads "Downstream copy. Canonical source is the figma-studio repo… edit there, not here; re-sync." (figma-studio Throughline v4.17 / May 18 2026 as of this copy.)

## Why scoped (not unconditional)

The Throughline content is imperative ("non-negotiable," "never skip," "push back") and AT&T-domain-bound. An unconditional import risked those rules bleeding into stratus *code* work — most acutely the 4pt-grid mandate vs. stratus's spacing-token scale, and Notion-DD vs. `.issues/`/`.memory/`. The guardrail keeps the methodology *available* for UI critique without letting it override repo conventions.

## Re-anchoring note (for actually running a Dual Read here)

The anchoring question — *"does this create connection, or does it extract?"* — is AT&T-domain-bound and "goes thin" for a designer-facing utility (the methodology says so itself). Re-anchor for stratus to: *does this component respect the user's agency/attention as they navigate/lint their file, or get in the way / over-claim?* Trust pillar re-reads as "no surprising/destructive action without a surfaced affordance." The mechanics (Cross-Map's 4 checks + Play Audit's 8 dimensions + 9 visual-craft principles) port unchanged.

## Remaining

- Downstream copy can drift from figma-studio canonical → see issue `trs` (re-sync when figma-studio's Throughline layer updates past v4.17).
