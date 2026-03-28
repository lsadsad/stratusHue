<!-- ============================================================
     finePrint — paste this block into your project's CLAUDE.md
     ============================================================ -->

## finePrint — Issue Tracking (`.issues/`)

Issues are plain markdown files with YAML frontmatter, tracked in git. No external tools needed.

```
.issues/
  open/       # active issues
  closed/     # completed issues
```

### Frontmatter schema

```yaml
---
id: sch              # short mnemonic ID (descriptive of the task)
category: scaffold   # feature area (define your own categories)
title: "..."
type: task|feature|bug|epic
priority: 1          # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []       # list of IDs this issue is blocked by
created: YYYY-MM-DD
---
```

### Categories

<!-- Replace these with your project's feature areas -->

| Category | Description |
|---|---|
| `feature-a` | Your first feature area |
| `feature-b` | Your second feature area |
| `infra` | Build system, CI/CD, tooling |
| `meta` | Cross-cutting — audits, process, infrastructure |

### Conventions

- File naming: `P{priority}-{category}-{id}-{slug}.md` (e.g., `P2-scaffold-sch-recipe-json-schema.md`)
- To close an issue: `git mv .issues/open/P2-scaffold-sch-*.md .issues/closed/`
- To find ready work: issues in `open/` with empty `depends_on` or all deps in `closed/`
- Dependencies reference other issue IDs (check `depends_on` arrays)
- Obsidian-compatible: open `.issues/` as a vault, use Dataview for queries
- See `.issues/README.md` for full how-to guide

### Trigger phrases

| Shortcut | Natural language | Action |
|---|---|---|
| `/issues` | "what's open" | List all open issues |
| `/ready` | "what's ready", "what should I work on" | Show unblocked issues only |
| `/issue X` | "show issue X" | Read a specific issue |
| `/track X` | "create an issue for X", "track this" | Write new `.issues/open/P{n}-{category}-{id}-{slug}.md` |
| `/close X` | "close X", "mark X done" | `git mv .issues/open/... .issues/closed/` |

## finePrint — Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions. Use `.memory/` for all persistent knowledge. See `.memory/README.md` for full format and conventions.

### Trigger phrases

| Shortcut | Natural language | Action |
|---|---|---|
| `/memory` | "check memory" | List all memory entries |
| `/recall X` | "what do we know about X" | Grep `.memory/` for topic |
| `/remember` | "remember this", "save to memory" | Write new `.memory/YYYY-MM-DD-slug.md` |
| `/supersede X` | "this replaces the decision on X" | New entry with "Supersedes:" reference |
