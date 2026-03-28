---
id: aud
category: meta
title: "Template methodology audit: confirm load-bearing elements with team"
type: task
priority: 1
status: open
depends_on: []
created: 2026-03-27
---

Audit the UX template with the team to confirm which elements are genuinely load-bearing before encoding them into the recipe schema. Several template elements may be redundant with Dev Mode or process theater that nobody actually uses.

Key suspects for removal or demotion:
- Components in Use panel (Dev Mode does this natively)
- About This Project form (may duplicate Jira/Confluence)
- iTrack links (Jira integration exists)
- Teaching tools (one-time use — Community template better)
- Collaborator strip (Figma shows collaborators natively)

Build order depends on this: audit → trim → design schema → build scanner. The recipe schema (sch) and readiness check (rdy) should not encode elements the team hasn't confirmed.

Reference: `docs/features/DISCOVERY_AUDIT.md`
Memory: `.memory/2026-03-25-template-audit-open-questions.md`
