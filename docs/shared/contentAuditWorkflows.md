# Content Audit Workflows

## Start Here

This is a leave-behind guide for anyone new to the content audit approach in stratusHue.

Use this document to understand:
- what we are trying to achieve
- how Scaffold, Navigate, and Validate fit together
- what decisions are still open
- what to do first if you are joining the work

## The Approach in One View

```text
Policy -> Scaffold -> Navigate -> Validate -> Delivery
   ^                                              |
   |-------------------- feedback ----------------|
```

What this means:
- Policy defines the rules for quality and readiness.
- Scaffold creates the starting structure from those rules.
- Navigate supports daily work while the file evolves.
- Validate checks whether the file still matches the rules.
- Feedback from Validate improves the policy and spec over time.

## How stratusHue Works in Practice

```text
1) POLICY DEFINITION (audit)
   -> agree on intent, completion, threshold rules
   -> record in TEMPLATE_AUDIT_REVIEW.md
   -> formalize in TEMPLATE_SPEC_REVISED.md / TEMPLATE_SPEC_FINAL.md

2) PROJECT START (Scaffold mode)
   -> select recipe variant
   -> create required structure + starter placeholders
   -> stamp recipe metadata to file

3) ACTIVE DESIGN (Navigate mode)
   -> run normal design iteration
   -> keep context/status visible during work

4) PRE-HANDOFF (Validate mode)
   -> run readiness checks against recipe contract
   -> token audit + component compliance + completion gates

5) FEEDBACK LOOP
   -> fail: fix file or refine unclear rule, rerun Validate
   -> pass: handoff is delivery-ready
```

## Rule System (What We Enforce)

```text
RuleTypes
  ├─ IntentRules      ("what should exist")
  ├─ CompletionRules  ("what done means")
  └─ ThresholdRules   ("numeric quality bars")
```

### Intent Rules (structure expectations)

Examples:
- Required sections exist (for example: `📔 COVER`, `🏁 FINAL`).
- Section order follows the selected deliverable pattern.
- Naming and emoji prefix conventions are consistent.
- Review entry formatting is standardized (`R[n] - MM.DD.YYYY`).

### Completion Rules (done-definition)

Examples:
- Required sections include valid status signals.
- Mandatory pages contain required annotation categories.
- `Dev Ready` signal exists in the agreed location/mechanic.
- Teaching/reference artifacts are removed before handoff.

### Threshold Rules (quality gates)

Examples:
- Style coverage meets the minimum target.
- Variable usage policy is met for spacing/radius/typography.
- Component compliance passes (detached/outdated/library usage rules).
- Hygiene checks pass (for example: unnamed frame count equals zero).

## Decision Flow for Meetings

```text
Start
  |
  v
Is policy clear?
  |-- no --> capture open questions
  |          (tokens, thresholds, variants, naming)
  |          -> return to policy review
  |
  |-- yes --> is scaffold contract defined?
              |-- no --> define schema fields from rules
              |
              |-- yes --> are validate checks mapped?
                          |-- no --> map each rule to concrete checks
                          |
                          |-- yes --> run readiness checks
                                      |
                                      v
                                    pass?
                                      |-- no --> fix file or refine rule
                                      |          -> rerun
                                      |
                                      |-- yes --> delivery ready
```

## First Week Checklist (New Teammate)

1. Read the current decision log in `docs/shared/templateAuditReview.md`.
2. Skim current synthesis in `docs/shared/templateAuditAnalysis.md`.
3. Review this workflow doc and confirm the rule types with your lead.
4. Identify which open questions block your workstream.
5. If building behavior, map one rule at a time to Scaffold or Validate.
6. Bring mismatches back to policy discussion before expanding scope.

## Common Pitfalls and Recovery

Pitfall: trying to encode all Figma state into recipe JSON.
- Recovery: keep recipe slim (intent, completion, thresholds), query live state at runtime.

Pitfall: implementing Validate checks before rule mechanics are defined.
- Recovery: pause implementation, resolve rule contract in policy docs first.

Pitfall: treating all deliverables as one workflow.
- Recovery: explicitly define variant/deliverable differences before threshold tuning.

## Glossary

- Recipe: the rule contract defining expected structure and readiness.
- Variant: a recipe profile for a specific deliverable type.
- Dev Ready: the agreed signal that annotation/handoff completeness is met.
- Readiness Check: final pass/fail audit against contract rules before delivery.

## Current Open Questions

```text
OpenQuestions
  ├─ neverHardcodeScope
  ├─ canonicalTokenList
  ├─ deliverableTypesAndThresholds
  ├─ exceptionsPolicy
  └─ placeholderNamingConvention
```

Open items to resolve:
- What exactly counts as "never hardcode"?
- What is the canonical style/token source for enforcement?
- What are the threshold numbers per deliverable type?
- What exceptions are acceptable for exploratory/new entries?
- What final naming convention should layer 2 variable placeholders use?

## Source of Truth and Mapping

```text
Policy decisions
  -> docs/shared/templateAuditReview.md
  -> docs/shared/templateSpecRevised.md
  -> docs/shared/templateSpecFinal.md
  -> Scaffold schema + Validate checks
```

This doc is the onboarding bridge between strategy decisions and day-to-day implementation behavior.
