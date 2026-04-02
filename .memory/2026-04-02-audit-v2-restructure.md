---
type: context
---

# Audit v2 doc restructure — session decisions

## What happened

Restructured the template audit questions and created a companion overview doc for the UX lead (Jen), who hasn't seen the stratusHue plans yet.

## Deliverables (in `docs/features/versions/`)

- **templateAuditQuestions_v2.md** — 38 questions, baseline answers pre-filled, Jen column for response
- **stratusHueOverviewForReview.md** — companion page explaining stratusHue and the audit/build distinction

## Key decisions

1. **Purpose statement first** — every doc opens with why it exists: async communication + pipeline shakedown record
2. **Option C for review flow** — baseline answers from template user experience, Jen confirms/corrects, then cherry-pick questions for broader team poll
3. **Section 3 (Element Check)** flagged as team poll candidate — where volume of responses matters
4. **Scaffold before Validate** in all plugin descriptions — matches build order
5. **Audit vs build are separate efforts** — made explicit in overview doc
6. **Removal rationale pattern** — every removal recommendation explains what replaces it and why (e.g., Components in Use → engineer onboarding for Dev Mode, not relying on Figma demos)
7. **camelCase filenames** — adopted for versions/ folder for mobile readability

## Spec writing framework (issue `spf`)

Emerging guidelines tested on these docs:
- Two-sentence paragraphs max
- Section titles carry weight — cut intros that repeat them
- Tables over prose for input/output mappings
- Bold inline prompts where specifics required
- Flagged as relay-kb candidate
