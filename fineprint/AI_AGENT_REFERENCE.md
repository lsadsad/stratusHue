# finePrint for AI Agents

Use finePrint as the repo's source of truth for work tracking and durable context.

## Core rule

- Track work in `.issues/`, not ad hoc markdown TODOs, external trackers, or chat memory.
- Track lasting project knowledge in `.memory/`, not in transient session notes.

## Where things live

```text
.issues/
  open/      active work
  closed/    completed work

.memory/
  *.md       append-only decisions, questions, context, workarounds
```

## Session start

1. List `.issues/open/` and understand what is already tracked.
2. List `.memory/` filenames.
3. Read all `decision` and `question` memory entries.
4. Read matching `context` entries if they relate to the task.
5. Skip `workaround` entries unless the task touches that area.

## Working with issues

### Read current work

- Open issues live in `.issues/open/`.
- A task is ready if `depends_on` is empty or all listed IDs are already in `.issues/closed/`.

### Create a new issue when

- The user identifies follow-up work that is not already tracked.
- You discover meaningful remaining work outside the current task.
- You need to preserve a concrete next step for a later session.

### Issue format

```yaml
---
id: abc
category: scaffold
title: "Short title"
type: task
priority: 2
status: open
depends_on: []
created: 2026-03-31
---

Plain-language description of the work.
```

### Naming

- File name format: `P{priority}-{category}-{id}-{slug}.md`
- Example: `P2-scaffold-sch-recipe-json-schema.md`

### Close completed work

- Move the file from `.issues/open/` to `.issues/closed/`.
- Keep the filename stable except when intentionally changing priority.

### Change priority

When priority changes:

1. Update `priority:` in frontmatter.
2. Rename the file prefix from `P2-...` to `P1-...` or equivalent.

## Working with memory

### Write memory when

- A design or implementation decision is made.
- An open question needs to be preserved for humans.
- A session produces durable findings worth carrying forward.
- A platform-specific workaround should be remembered.

### Memory types

- `decision`: choice plus rationale
- `question`: unresolved item requiring input
- `context`: findings or session summary worth keeping
- `workaround`: specific gotcha or workaround

### Memory rules

- Append-only: never rewrite old memory entries.
- If a decision changes, create a new file and note what it supersedes.
- Do not duplicate what is already clear in code, git history, or existing issues.

### Memory format

```yaml
---
type: decision
tags: [recipes, scaffold]
created: 2026-03-31
supersedes: 2026-03-25-old-decision
---

Decision and rationale in plain prose.
```

## Recommended workflow

1. Check `.issues/` before starting work.
2. Check `.memory/` before making assumptions.
3. Implement the task.
4. If new work appears, file a new issue.
5. If new lasting context appears, write a memory entry.
6. If an issue is done, move it to `.issues/closed/`.

## End-of-session expectations

If the session changes code or tracked project state:

1. File issues for remaining work.
2. Run relevant quality gates.
3. Close completed issues.
4. Commit and push if the session goal includes wrap-up or shipping.

## Anti-patterns

- Do not create standalone TODO markdown files outside `.issues/`.
- Do not edit old memory entries in place.
- Do not keep important decisions only in chat.
- Do not leave discovered follow-up work untracked.

## Shorthand phrases used in this repo

- `issues plz`: list open issues
- `what's ready`: show unblocked issues
- `show X`: read an issue
- `track this`: create an issue
- `done X`: close an issue
- `check memory`: list memory entries
- `recall X`: search memory
- `save context`: write a memory entry
- `wrap up`: finish issue tracking, run gates, and push

## Canonical references

- `fineprint/README.md`
- `.issues/README.md`
- `.memory/README.md`
- `CLAUDE.md`
- `AGENTS.md`
