# stratusHue — What It Is and Why We're Asking

Companion to `TEMPLATE_AUDIT_QUESTIONS_v2.md`

---

## Two things happening at once

1. **Template audit** — shaking down the current design-to-delivery pipeline to find what's load-bearing, what's ceremony, and what needs rework. This is a team conversation about process.
2. **Plugin build** — stratusHue, a Figma plugin that automates what the audit confirms. The audit feeds the build, not the other way around.

They're separate efforts. The audit can surface changes to the template that have nothing to do with the plugin. The plugin only acts on what the audit confirms.

---

## What is stratusHue?

A Figma plugin with three modes, built in this order:

| Mode | What it does | Status |
|---|---|---|
| **Navigate** | Move through file structure — bookmarks, emoji nav, status dots | Built |
| **Scaffold** | Generate new files from a recipe — correct sections, order, and structure from day one | Planned |
| **Validate** | Check a file against team rules — style coverage, component compliance, handoff readiness | In progress |

---

## Why the audit?

The plugin needs to know what "correct" looks like. That comes from the team's template methodology — not from us guessing.

The audit captures:
- Which elements are load-bearing (plugin enforces them)
- Which are ceremony (plugin ignores them)
- What thresholds matter (100% style coverage? teaching tools deleted?)
- What "handoff-ready" actually means

---

## How your answers get used

| You tell us | What happens |
|---|---|
| "Cover page, sections, and delivery assets are the top 3" | Scaffold generates those first |
| "100% style references at handoff" | Validate flags hardcoded values |
| "Teaching tools must be deleted before delivery" | Validate checks for them |
| "Status dot updates are inconsistent" | Navigate standardizes the method |

Nothing gets built without a documented answer. If it's ambiguous, we'll ask again.

---

## When we recommend removing something

Each removal has a rationale and a replacement path. If it doesn't make sense for the team, flag it.

**Example: Components in Use panel**
Dev Mode already does this natively. Removing the panel frees up designer effort and lets us invest that time in building onboarding docs for engineers — rather than waiting on Figma to demo it for them.

---

## What we need from you

1. **Answer the audit questions** — async, at your pace
2. **Be specific** where prompted — "yes" without detail blocks the build
3. **Flag disagreements** — if a recommendation doesn't match reality, say so

Your input directly shapes what gets built and what gets changed. This is a team effort.

---
