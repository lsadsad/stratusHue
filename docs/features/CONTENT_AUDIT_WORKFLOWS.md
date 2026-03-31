# Content Audit Workflows

Captured during the Phase 4 content writer approach discussion for the `aud` epic.

## Recommended Workflow

```text
Policy -> Scaffold -> Navigate -> Validate -> Delivery
   ^                                              |
   |------------------ feedback ------------------|
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
