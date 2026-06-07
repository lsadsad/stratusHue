> Downstream copy. **Canonical source is the figma-studio repo's `CLAUDE.md` Throughline operating layer** — edit there, not here; re-sync this file from it. Do not edit in place. Content as of figma-studio's May 18, 2026 (v4.17) version.

---

# CLAUDE.md — Throughline × Figma

Operating-layer instructions for Claude Code when working on Throughline design artifacts in Figma via figma-console-mcp. Read on every session start.

**What Throughline is:** a design-evaluation methodology for AT&T's mobile app team. The thesis is that design *is* connection — every screen either creates connection or extracts. Throughline is the lens for telling which.

**What Throughline is not:** a style guide, a component library, or a process to roll out. The component library is the **AT&T Relay Design System** — always written in full. Never shorten to "Relay" alone; that name was Throughline's earlier working title and the collision is live.

> ::note **This file is the operating layer; the deep canon lives in the `figma-kb` knowledge base.** The methodology summarized below (anchoring question, three pillars, Dual Read, AT&T Relay Design System) is mirrored in full — plus accumulated critique patterns — in `figma-kb`. Reach for it via groundControl: `kb-search project:"figma-kb"` / `kb-get-document project:"figma-kb" id:"methodology:dual-read"`. Keep depth there, keep the pointer here. See the **Knowledge Base** section below.

---

## Scope — what this file covers, what it defers to

**Covers:**

- The anchoring question and the three pillars as evaluative lenses
- The Dual Read (Cross-Map + Play Audit) as critique-craft
- The five connection failure patterns as named vocabulary
- The Nibble Card vocabulary and component architecture
- 4pt grid as dimensional discipline
- Iteration sequence (ASCII → HTML → Figma → Rive)

**Defers:**

- Classical visual craft — balance, alignment, hierarchy as visual phenomena, composition, density, rhythm, negative space, type scale → AT&T UI principles (AD-owned); operational guidance lives in `CLAUDE-visual-craft.md`
- Color tokens, contrast ratios, spacing tokens → AT&T Relay Design System
- Brand consistency → AT&T Relay Design System tokens
- UX flow principles (Jen's draft, politically sensitive) → not Throughline's territory; if a question lands here, surface it rather than absorb it
- Motion-specific evaluation → `CLAUDE.md` in the rive-studio repo

**When asked a question outside this scope:** name which surface owns the answer. Don't improvise. The pattern to avoid: extending Throughline into visual-craft territory because the question came in through the Figma surface.

**Visual-craft companion (test layer, imported at load):**

@CLAUDE-visual-craft.md

---

## The anchoring question

> **Does this create connection, or does it extract?**

The working form. Asked at every level, on every shipped decision — everything else is commentary. Exact AT&T-specific wording remains open; the function is locked, the words are still settling.

Domain-bound by design: AT&T mobile app, consumer-facing, contractual stakes, hierarchical relationship. Outside that domain the question goes thin — feature, not flaw. The trap to avoid is making Throughline portable by swapping the anchoring question per domain. That produces a meta-methodology, which violates Sicart by abstraction.

---

## The three pillars

Every screen reads through three lenses. When all three hold, connection lands. When any one is missing, the work drifts toward extraction.

### Language — every word points to an outcome, not an obligation

- ✅ "Deals unlock at 33%"
- ❌ "Your minimum payment threshold is $300"

### Signal — every signal element earns its meaning

Across visual, motion, auditory, haptic. A refresh icon *outlined* in the gauge vs. *filled* in the strip carries semantic difference, not decoration. Cross-modal congruence operates inside a ~100ms binding window — bundle sonic / haptic / motion / color cues that tightly or they read as separate events.

### Trust — every constraint is surfaced, not hidden

The trade-in requirement appears on the Nibble Card — not buried in Terms & Conditions.

The empirical substrate for the Trust pillar lives in the project knowledge document on disclosure, dark patterns, installment comprehension, and trust calibration. Progressive Leasing is the near-exact structural precedent for the AT&T NUA fee situation. When critique work touches an installment-flow frame, reach for the substrate — naming a Trust failure is stronger when the precedent is cited.

A companion substrate — *evidence on interface redesigns against extraction* — documents what *works* (and what doesn't) when interfaces are deliberately redesigned to reduce extraction. The single most important finding: **three conditions must align** for interface change to produce durable behavioral change at the substrate level — (1) defaults flip toward the user-protective option, (2) backend systems are constrained so interface decisions propagate to the data layer, (3) standardization is enforced over time so users develop reliable mental models. Interface-only redesigns get recaptured. *Papadogiannakis et al. found first-party ID leaks rose from 2.14 to 2.49 per site after users clicked "reject all" — the surface changed; the substrate didn't.*

For Throughline at AT&T: surfacing a constraint in the Nibble Card is necessary but not sufficient. When critiquing a Trust-pillar move, ask whether the change is decoupled from backend reality. A surfaced constraint that the system still routes around is theater, not Trust.

---

## Critique mode — the Dual Read

Throughline operates as a three-layer framework: **Intent** (what the screen is trying to say, pillar-tagged), **Craft** (which form the intent becomes), and **Operating** (how sessions and decisions run). The Dual Read is Craft-layer work — evaluating whether the intended communication survives the form it took.

When evaluating any Figma frame, run both reads. Both must hold. When they disagree, the disagreement is data — surface it, don't smooth it.

### Cross-Map read — is the craft sound?

Pillars × craft dependencies × accessibility. Four checks:

- **Temporal order** — does the sequence of reveals match the user's decision sequence?
- **Redundant encoding** — is critical info carried in at least two channels (color + shape, position + label)?
- **Historical precedent** — does this echo a form that's already working, or invent without reason?
- **Cognitive limits** — does the screen respect working-memory capacity at the moment of decision?

### Play Audit read — did this land as connection?

Eight dimensions:

1. **Voluntariness** — can the user meaningfully decline, exit, reshape, revisit without penalty?
2. **Frame clarity** — does the interface signal "exploration" vs. "consequence"?
3. **Meaningful choice** — do user actions produce *perceptible* and *integrated* effects?
4. **Lusory attitude invited** — does constraint enrich or strip?
5. **Scaffolded agency** — does structure preserve agency (guided) or remove it (forced funnel)?
6. **SDT nourishment** — does the interaction feed autonomy / competence / relatedness, or substitute badges and streaks?
7. **Grokkability** — is the user still learning, or has the interface stopped teaching?
8. **Back-talk** — does the material respond to user moves in a way that invites further moves?

**Empirical grounding (SDT substrate).** Self-determination theory has meta-analytic backing for the dimensions above. Engagement-contingent tangible reward correlates negatively with intrinsic motivation (d ≈ −0.40); positive feedback correlates positively (d ≈ +0.33). Neural, endocrine, and immunological markers distinguish voluntary from controlled engagement. When the Play Audit flags a voluntariness or scaffolded-agency failure, the substrate is the citation. Reach for it.

Verb form: "Let's dual-read this." / "The dual-read turned up a trust gap."

---

## Connection failure patterns to flag

First-class vocabulary. When critiquing, name them by name.

- **Hidden Terms** — constraints buried where users won't see them until it's too late. *Trust* violation.
- **False Hierarchy** — visual prominence doesn't match semantic importance. *Signal* violation.
- **Promise Gap** — copy promises something the system can't or won't deliver. *Language* violation.
- **Decision Orphan** — user asked to decide without the information needed to decide well. *Trust + Language*.
- **Trust Erosion** — small, repeated breaks of expectation compounding across sessions. Cross-pillar.

---

## Create mode — working vocabulary

The current proof-of-concept is the **Nibble Card** — installment progress for AT&T's device payment plans. The vocabulary below is shipping language, not draft.

**Architectural rule: the gauge shows; the Signal Strip speaks.** Data layers measure. Communication layers interpret. Each layer owns its content without overlap — no dollar amount in both card body and strip.

### Signal Strip copy registers

Five contextual registers. Pick the one matching user intent:

1. **Outcome** — "$96 to unlock upgrade deals"
2. **Math** — "27 mo = $900 / 3 mo = $100"
3. **Momentum** — "You're 3 payments away"
4. **Agency** — "Switch any time after $396"
5. **Cycle** — "3 payments from a fresh start"

### Information vs. Decision separation

- *Inline expand* = reference context (cost breakdown, where am I?)
- *Bottom sheet modal* = decision context (options, what can I do?)
- The disclosure mechanism signals the nature of the content. Don't blur this.

---

## Standing constraints

### 4pt grid — non-negotiable

Every dimension snaps to a multiple of 4. Heights, widths, padding, spacing, icon containers, touch targets. If a Figma value isn't divisible by 4, fix it or flag it. No exceptions.

### Iteration sequence — never skip

ASCII mockup → HTML interactive diagram → Figma-ready spec → Rive build. If asked to jump straight to Figma without an ASCII or HTML pass first, push back.

### Decision discipline

- Every decision worth keeping gets a **DD-NNN** entry in Notion (Design Decisions DB).
- Every new noun gets a **Throughline Vocabulary** entry before reuse.
- No silent decisions.

---

## The Sicart Rule — non-negotiable

> Throughline produces contexts that invite appropriation. It does not require behaviors.

- ✅ Critique a frame against the pillars when asked.
- ✅ Generate Figma work that holds the pillars.
- ✅ Surface failure patterns when they appear.
- ❌ Do not invent metrics on framework activity (audit count, DD count, "compliance score").
- ❌ Do not produce checklists that turn the methodology into a gate.
- ❌ Do not score frames on a 1–5 pillar rubric.

When asked "how do we know this is working?" — the answer is never a count. It's *"the trade-in disclosure is no longer buried."*

---

## Naming hygiene

- **Throughline** — use the name, not "the framework"
- **AT&T Relay Design System** (always in full) — never "Relay" alone
- **Connection vs. Transaction** — not "Good UX vs. bad UX"
- Historical artifacts using "Relay" for the methodology are left as-is — including older Notion DDs and KB files (`relay-vocabulary-installment-progress.md`, `relay-kb-seed-feb25.md`). New work uses Throughline. Mixed-usage hazard: when a file uses "Relay" as the methodology in one line and as the design system in another, read context, not just the word.

---

## Working with figma-console-mcp

**Reading a frame:** Pull frame, variables, component instances in one diagnostic pass. Identify which named component the frame is or contains. Run the Dual Read before suggesting changes.

**Writing to a frame:** Confirm reversibility before applying. Snap every new value to 4pt. Match existing variable tokens. Confirm structural moves in chat before executing.

**When the file disagrees with the methodology:** Don't silently correct. Flag the disagreement, name the pillar, propose the fix, wait for confirmation.

---

## When in doubt

- Additive, not corrective.
- Lives inside existing feature windows.
- Don't seed ahead of need.
- If a proposal turns framework activity into a metric, push back hard.
- If naming is unclear, ask.

---

*Throughline is methodology. The AT&T Relay Design System is the component library. Different organs — don't collapse them.*
