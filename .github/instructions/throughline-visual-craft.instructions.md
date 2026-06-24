---
applyTo: "CLAUDE-throughline.md,CLAUDE-visual-craft.md,docs/features/**/*,.memory/**"
---

# Throughline × visual craft (path-specific, scoped)

Applies when working on design-critique companions, feature specs/recipes, or project memory that touches frame composition — **not** plugin TypeScript under `src/`.

## Scope guardrails (read first)

Throughline applies **only** to Figma design-critique work. It does **not** govern stratusHue code, build, or repo workflow. On any conflict, **stratusHue conventions in `CLAUDE.md` take precedence**:

- **Spacing/sizing:** stratusHue `--spacing-*` / `--button-height-*` / `--icon-size-*` tokens — not Throughline's 4pt-grid rule
- **Decisions & tracking:** `.issues/` + `.memory/` — not Notion DD-NNN
- **figma-studio-only references** (Nibble Card, AT&T Relay Design System, `figma-kb`, rive-studio, ASCII → HTML → Figma → Rive sequence) = inherited background, not directives here

## What to read

1. **`CLAUDE.md`** § Design methodology — Throughline (scoped companion layer)
2. **`CLAUDE-throughline.md`** — methodology depth (downstream copy; canonical source is figma-studio)
3. **`CLAUDE-visual-craft.md`** — balance, hierarchy, composition, density, rhythm, type scale

Do not duplicate those files here. For plugin architecture, lint, and prototype work, use root `CLAUDE.md` and `.github/copilot-instructions.md` instead.
