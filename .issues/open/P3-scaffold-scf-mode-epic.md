---
id: scf
category: scaffold
title: "Phase 3: Scaffold mode — epic"
type: feature
priority: 3
status: open
depends_on: [tab, tpl, stm]
created: 2026-03-21
branch: claude/backlog-lower-1120
---

Full implementation of the Scaffold mode tab. Scaffold reads recipe layers ①② (structure + content) to create pages, section containers, content frames, and variable placeholders in a Figma file. This epic tracks all sub-tasks: recipe schema, sandbox implementation, UI, and team sharing.

## Absorbed — 2026-11-20

These tickets were folded into this one in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123"). Each keeps its body in `.issues/closed/`.

- **Recipe import/export for teams** (`exp`): Scaffold was never built: `src/ui/scaffold/scaffold-ui.ts` is still the 4-line placeholder (last touched 03-10), and the roadmap marks Scaffold "Concept only". Carry this as a checklist box on the epic `scf` (open); the body is one paragraph.
- **Recipe loader and parser** (`ldr`): Never built (no recipe loader under `src/`; `git grep -i recipe origin/main -- src` finds only the placeholder comment). One-paragraph task; carry as a box on `scf`.
- **Create pages from a recipe** (`pgs`): `src/features/scaffold-engine.ts`, the file it names, does not exist on `origin/main`. Carry as a box on `scf`.
- **Stamp the applied recipe into the file** (`stm`): No `setPluginData` recipe stamp in `src/` (`git grep -i recipe origin/main -- src`). One-paragraph task; carry as a box on `scf`.
- **Scaffold tab UI** (`tab`): The UI it would implement is the placeholder at `src/ui/scaffold/scaffold-ui.ts:1-5`. Carry as a box on `scf`.
- **Create starter content from a recipe** (`tpl`): Depends on `pgs`, also unbuilt. Carry as a box on `scf`.

## Lowered to P3 — 2026-11-20

Lowered from P2 to P3 in the 2026-11-20 backlog review. Ruled by Levin 2026-11-20: "Yes", to the question "Lower the 14 medium-priority tickets the review proposed to low?" The ticket stays open; nobody is waiting on it.

Evidence, from the review: Still planned, never started. Current `CLAUDE.md:97` keeps mode plumbing "for the planned Scaffold work"; the v1.6.0 notes (10-03) say the checks are "being rebuilt on recipes". Its prerequisite, the template audit `aud`, is open at P1. Zero scaffold code since 03-10.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
