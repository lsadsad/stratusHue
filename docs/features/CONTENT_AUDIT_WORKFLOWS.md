# Content Audit Workflows

Captured during the Phase 4 content writer approach discussion for the `aud` epic.

## Recommended Workflow

```text
Policy -> Scaffold -> Navigate -> Validate -> Delivery
   ^                                              |
   |------------------ feedback ------------------|
```

## Visual Summary

```text
CONTENT_AUDIT_WORKFLOWS.md

Policy -> Scaffold -> Navigate -> Validate -> Delivery
   ^                                              |
   |------------------- feedback -----------------|

RuleTypes
  ├─ IntentRules
  │   ├─ requiredSections
  │   ├─ sectionOrder
  │   └─ namingConventions
  ├─ CompletionRules
  │   ├─ statusSignals
  │   ├─ annotationRequirements
  │   └─ devReadyAndCleanup
  └─ ThresholdRules
      ├─ styleCoverage
      ├─ variableUsage
      └─ componentCompliance

OpenQuestions
  ├─ neverHardcodeScope
  ├─ canonicalTokenList
  ├─ deliverableTypesAndThresholds
  ├─ exceptionsPolicy
  └─ placeholderNamingConvention

ImplementationMapping
  policyDecisions
    -> TEMPLATE_AUDIT_REVIEW.md
    -> TEMPLATE_SPEC_REVISED.md
    -> TEMPLATE_SPEC_FINAL.md
    -> ScaffoldSchema + ValidateChecks
```

## Decision Flow (Meeting View)

```text
Start
  |
  v
Is policy clear?
  |-- no --> Capture open questions
  |          (tokens, thresholds, variants, naming)
  |          -> return to policy review
  |
  |-- yes --> Scaffold contract defined?
              |-- no --> define intent/completion/threshold fields
              |          in schema contract
              |
              |-- yes --> Validate rules mapped?
                          |-- no --> map each contract rule
                          |          to a concrete check
                          |
                          |-- yes --> Run readiness checks
                                      |
                                      v
                                  Pass?
                                    |-- no --> fix file or refine rule
                                    |          -> rerun validate
                                    |
                                    |-- yes --> Delivery ready
```

## How We Work in stratusHue

Use this as the practical operating model for team discussions and implementation alignment.

```text
POLICY DEFINITION (audit)
  -> agree on intent, completion, threshold rules
  -> capture decisions in TEMPLATE_AUDIT_REVIEW.md
  -> finalize in TEMPLATE_SPEC_REVISED.md / TEMPLATE_SPEC_FINAL.md

PROJECT START (Scaffold mode)
  -> select recipe variant
  -> create required structure + starter placeholders
  -> stamp recipe metadata to file

ACTIVE DESIGN (Navigate mode)
  -> do daily design work
  -> use navigation/status affordances during iteration

PRE-HANDOFF (Validate mode)
  -> run readiness checks against recipe contract
  -> token audit + component compliance + completion gates

FEEDBACK LOOP
  -> if fail: fix file or refine unclear rule, then rerun
  -> if pass: handoff is delivery-ready
```

1. Define content policy first (intent, completion, thresholds).
2. Use Scaffold at project start to create the baseline structure and placeholders.
3. Use Navigate during active design work to manage movement and status updates.
4. Use Validate before handoff to check structure, quality, and readiness.
5. Feed validation outcomes back into policy/spec when rules are unclear or incorrect.

## Rule Types and Examples

### Intent Rules (what should exist)

- Required sections exist (for example: `📔 COVER`, `🏁 FINAL`).
- Section order is valid for the selected deliverable type.
- Naming and emoji prefix conventions are followed.
- Review entry format is standardized (for example: `R[n] - MM.DD.YYYY`).

### Completion Rules (what counts as done)

- Required sections have valid status signals.
- Mandatory pages include required annotation categories.
- `Dev Ready` signal exists in the agreed implementation pattern.
- Teaching/reference artifacts are removed before handoff.

### Threshold Rules (numeric pass/fail gates)

- Style coverage meets minimum target (for example: 100% or per-variant threshold).
- Variable usage for spacing/radius is enforced by policy.
- Component compliance passes:
  - detached instance policy
  - outdated version policy
  - minimum library usage percentage by deliverable
- Hygiene gates pass (for example: unnamed frame count equals zero).

## Open Questions for Content Variables and Thresholds

- What exact rule defines "never hardcode" (all Foundations, explicit list, or hybrid)?
- What concrete style/token list is canonical for enforcement?
- What are deliverable types and threshold numbers per type?
- What exceptions are valid for exploratory/new entries?
- What tool-agnostic naming convention is final for layer 2 variable placeholders?

## Implementation Mapping

```text
Human policy decision
  -> docs/features/TEMPLATE_AUDIT_REVIEW.md decisions
  -> docs/features/TEMPLATE_SPEC_REVISED.md
  -> docs/features/TEMPLATE_SPEC_FINAL.md
  -> Scaffold schema + Validate checks
```

This document is a working bridge between audit discussion outcomes and final spec mapping.
