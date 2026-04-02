# stratusHue Onboarding One-Pager

## Purpose

This one-pager explains, at a high level, what stratusHue is trying to accomplish with the shift toward Scaffold and Validate, and why this shift matters.

Audience: teammates who are new to stratusHue and have not participated in the template audit work.

## What We Are Trying to Accomplish

Move from a manual, template-duplication workflow to a rules-driven workflow that is:
- faster to start
- more consistent across files
- easier to audit before handoff
- less dependent on tribal knowledge

In short: define quality once, instantiate it consistently, and verify it before delivery.

```text
Old way: duplicate template -> trim pages -> manual checks -> handoff risk
New way: policy contract  -> scaffold file -> validate gates -> confident handoff
```

## Why This Shift Is Happening

The team found that delivery friction is the biggest pain point. Common issues:
- setup work is repetitive and error-prone
- "done" is interpreted inconsistently
- checks happen late and rely on memory
- important conventions are not encoded as enforceable rules

Scaffold and Validate address this by turning agreed conventions into an explicit contract.

## The High-Level Model

```text
Policy -> Scaffold -> Navigate -> Validate -> Delivery
   ^                                              |
   |-------------------- feedback ----------------|
```

- Policy: define what should exist, what counts as done, and quality thresholds.
- Scaffold: create the file structure/content placeholders from that policy.
- Navigate: support day-to-day work while the file evolves.
- Validate: check the file against the same policy before handoff.
- Feedback: use validation outcomes to improve the contract over time.

## What "Policy Contract" Means

Policy is organized into three rule types:

```text
RuleTypes
  ├─ IntentRules      ("what should exist")
  ├─ CompletionRules  ("what done means")
  └─ ThresholdRules   ("quality bar numbers")
```

Examples:
- Intent: required sections, order, naming conventions.
- Completion: required status signals, annotation requirements, Dev Ready signals.
- Thresholds: style/token coverage targets, component compliance, hygiene checks.

## What Success Looks Like

```text
Project start:
  less setup time, fewer structure mistakes

During work:
  shared expectations and visible progress signals

Before handoff:
  clear pass/fail readiness with actionable gaps
```

Success metric: lower delivery friction and fewer avoidable handoff defects.

## Plugin Mockup Layout (ASCII)

Use this to explain the interface shape quickly during onboarding.

```text
+--------------------------------------------------+
| stratusHue                                       |
| [Navigate] [Validate] [Scaffold]                |
+--------------------------------------------------+
|                                                  |
|  Mode content area                               |
|                                                  |
|  Navigate: bookmarks, anchors, context           |
|  Validate: lint/readiness/token/component checks |
|  Scaffold: recipe select + apply                 |
|                                                  |
+--------------------------------------------------+
| Footer actions / status                          |
+--------------------------------------------------+
```

```text
Scaffold flow (mock)

[Scaffold tab]
   -> [Select recipe variant]
   -> [Preview required/optional sections]
   -> [Apply scaffold]
   -> [Recipe metadata stamped]
```

```text
Validate flow (mock)

[Validate tab]
   -> [Run checks]
   -> [Readiness + Token + Component results]
   -> [Pass] or [Fix issues and rerun]
```

## Role-Based Journey (ASCII)

```text
Designer journey
  Scaffold start -> Design iteration (Navigate) -> Validate -> Handoff

Reviewer/lead journey
  Define policy -> review validation output -> refine rules -> sign-off

Engineering journey
  Receive validated handoff -> fewer missing details -> smoother delivery
```

## What Is Still Being Finalized

Some policy details are still open and being resolved through the audit process, including:
- exact never-hardcode style/token scope
- deliverable type variants and threshold values
- final naming conventions for certain placeholders

This is expected. The contract is being refined before full enforcement is expanded.

## Where to Go Next

If you are new and want details in order:
1. `docs/features/audit/contentAuditWorkflows.md` (working model and operational flow)
2. `docs/features/audit/templateAuditReview.md` (current decisions and open questions)
3. `docs/features/audit/templateAuditAnalysis.md` (full synthesis and rationale)

If you are implementing behavior:
- map one policy rule at a time to Scaffold or Validate
- avoid implementing checks where rule mechanics are still undefined
- route ambiguity back to policy docs before expanding scope
