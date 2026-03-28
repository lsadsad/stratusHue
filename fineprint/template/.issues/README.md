# Issue Tracking — finePrint

Plain markdown files with YAML frontmatter, tracked in git. No external tools needed.

```
.issues/
  open/       # active issues
  closed/     # completed issues
```

## Quick start

### View open issues

Browse `.issues/open/` or ask an AI agent:

```
what's open
/issues
```

### Find unblocked work

Issues whose `depends_on` list is empty or whose dependencies are all in `closed/`:

```
what's ready
/ready
```

### Read a specific issue

```
show issue sch
/issue sch
```

### Create an issue

```
track "add dark mode support"
/track "add dark mode support"
```

The agent creates `.issues/open/P{priority}-{category}-{id}-{slug}.md` with frontmatter.

### Close an issue

```
close sch
/close sch
```

Under the hood: `git mv .issues/open/P2-scaffold-sch-*.md .issues/closed/`

### Change priority

Update the `priority:` field in the frontmatter **and** rename the file prefix to match:

```
P0 = critical, P1 = high, P2 = medium, P3 = low, P4 = backlog
```

For example, promoting `sch` to P1:

1. Edit `priority: 1` in the frontmatter
2. `git mv .issues/open/P2-scaffold-sch-recipe-json-schema.md .issues/open/P1-scaffold-sch-recipe-json-schema.md`

## Frontmatter schema

```yaml
---
id: sch                  # short mnemonic ID (descriptive of the task)
category: scaffold       # feature area (define your own)
title: "Design recipe JSON schema"
type: task               # task | feature | bug | epic
priority: 2              # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []           # list of issue IDs this is blocked by
created: 2026-03-21
---

Description of the work in plain prose.
```

## File naming

```
P{priority}-{category}-{id}-{slug}.md
```

Examples:

```
P1-meta-aud-template-methodology-audit.md
P2-scaffold-sch-recipe-json-schema.md
P3-validate-rdy-readiness-check.md
```

## Categories

Define categories that match your project's feature areas. Common patterns:

| Category | Description |
|---|---|
| `feature` | A specific feature area (name it after the feature) |
| `infra` | Build system, CI/CD, tooling |
| `meta` | Cross-cutting — audits, process, documentation |
| `bug` | Bug fixes (or use `type: bug` with a feature category) |

## IDs

IDs are short (2-3 character) mnemonics descriptive of the task:

- `sch` for schema, `ldr` for loader, `nav` for navigation
- `cfg` for configuration, `fix` for a bug fix, `tst` for testing
- Pick something that reads naturally when spoken aloud

## Dependencies

The `depends_on` array lists issue IDs that must be closed before work can start:

```yaml
depends_on: [sch, ldr]   # blocked until both sch and ldr are closed
```

An issue is **ready** when `depends_on` is empty or every listed ID exists in `.issues/closed/`.

## AI agent trigger phrases

| Shortcut | Natural language | Action |
|---|---|---|
| `/issues` | "what's open" | List all open issues |
| `/ready` | "what's ready to work on" | Show unblocked issues only |
| `/issue X` | "show issue X" | Read a specific issue |
| `/track X` | "create an issue for X" | Write new issue file |
| `/close X` | "close X", "mark X done" | `git mv` to `closed/` |

## Obsidian

Open `.issues/` (or the repo root) as an Obsidian vault. Query with Dataview:

```dataview
TABLE title, category, type, priority, status, depends_on
FROM ".issues/open"
SORT category ASC, priority ASC
```
