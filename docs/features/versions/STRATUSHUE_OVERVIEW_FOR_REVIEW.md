# stratusHue — What It Is and Why We're Asking

Companion to `TEMPLATE_AUDIT_QUESTIONS_v2.md`

---

## What is stratusHue?

A Figma plugin we're building to reduce friction in the design-to-delivery pipeline. Three modes:

| Mode | What it does |
|---|---|
| **Navigate** | Move through file structure — bookmarks, emoji nav, status dots. Already built. |
| **Validate** | Check a file against team rules — style coverage, component compliance, handoff readiness. In progress. |
| **Scaffold** | Generate new files from a recipe — correct sections, order, and structure from day one. Planned. |

---

## Why the audit?

The plugin needs to know what "correct" looks like before it can validate or scaffold anything. That comes from your team's template methodology — not from us guessing.

The audit captures:
- Which template elements are load-bearing (plugin enforces them)
- Which are ceremony (plugin ignores them)
- What thresholds matter (100% style coverage? teaching tools deleted?)
- What "handoff-ready" actually means

---

## How your answers get used

| You tell us | Plugin does |
|---|---|
| "Cover page, sections, and delivery assets are the top 3" | Scaffold generates those first |
| "100% style references at handoff" | Validate flags hardcoded values |
| "Teaching tools must be deleted before delivery" | Validate checks for them |
| "Status dot updates are inconsistent" | Navigate standardizes the method |
| "Components in Use panel is redundant" | We don't build it |

Nothing gets built without a documented answer. If it's ambiguous, we'll ask again.

---

## What we need from you

1. **Answer the audit questions** — async, at your pace
2. **Be specific** where prompted — "yes" without detail blocks the build
3. **Flag disagreements** — if a recommendation doesn't match reality, say so

Your input directly shapes what the plugin does and doesn't do. This is a team effort.

---
