---
type: decision
---

# docs/features reorganized into subdirectories with camelCase names

## What changed

`docs/features/` was a flat directory of 22 files (SCREAMING_SNAKE_CASE). Reorganized into three subdirectories:

- `audit/` — template methodology audit chain (5 files). The UX lead deliverable is `audit/templateAuditReview.md`.
- `specs/` — active and future feature specs (8 files)
- `reference/` — shipped feature docs, guides, internal refactors (7 files)
- `recipes/` — unchanged

All files renamed to camelCase. 19 files with cross-references updated (issues, memory, roadmap, copilot-instructions, standalone README, etc.).

## Why

User couldn't scan filenames quickly. CamelCase letterforms are easier to read than SCREAMING_SNAKE. Subdirectories group by purpose so the audit trail is findable at a glance.

## Future files follow the convention

- Phase 5 output: `audit/templateSpecRevised.md`
- Phase 6 output: `audit/templateSpecFinal.md`
