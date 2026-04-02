# Project Memory — finePrint

Append-only knowledge base for decisions, open questions, session context, and
selective workarounds. Read by AI agents at session start; written by agents
and humans when context is worth preserving across sessions.

Synced via git — committed to the repo, not gitignored.

## Quick start

### List all memories

Browse the `.memory/` directory or ask an AI agent:

```
check memory
/memory
```

### Search for a topic

```
what do we know about recipes
/recall recipes
```

The agent greps `.memory/` for matching entries.

### Save a new memory

```
remember this: we chose JSON over YAML for recipes because Figma's sandbox has no YAML parser
/remember
```

The agent creates `.memory/YYYY-MM-DD-slug.md` with frontmatter.

### Replace an outdated decision

```
this replaces the decision on recipe format
/supersede recipe-format
```

The new entry includes a `Supersedes: .memory/old-entry.md` reference. The old entry is never edited or deleted.

## Entry format

Each file is `YYYY-MM-DD-slug.md` with YAML frontmatter:

```yaml
---
type: decision           # decision | question | context | workaround
tags: [recipes, schema]
created: 2026-03-25
---

Plain prose content. Include rationale for decisions, not just the outcome.
```

## Types

| Type | Use when | Example |
|---|---|---|
| `decision` | A design choice was made — include rationale | "Chose JSON over YAML for recipe format" |
| `question` | Open question needing human input | "Should recipes support inheritance?" |
| `context` | Session summary, findings worth keeping | "Template audit findings from review" |
| `workaround` | Platform-specific gotchas (selective, not general) | "Figma loadFontAsync must be called before editing text" |

## Rules

- **Append-only**: never edit an existing entry. Write a new one that references it.
- **Superseding**: include `Supersedes: .memory/old-entry.md` when replacing a decision or answering a question.
- **File naming**: `YYYY-MM-DD-slug.md` (slugs unique within a date).
- **Tags**: freeform, for filtering and Obsidian Dataview queries.
- **No index file**: scan the directory or use Dataview.
- **Don't duplicate**: if it's in git history, code, or issues, don't repeat it here.

## Cross-referencing

Reference issues from memory entries and vice versa:

```markdown
<!-- in a memory entry -->
Related: .issues/open/P2-sch-recipe-json-schema.md

<!-- in an issue body -->
See: .memory/2026-03-25-recipe-design-principle.md
```

## For AI agents

At session start:
1. List `.memory/` filenames
2. Always read `decision` and `question` entries
3. Read `context` entries if tags/slug match current work
4. Skip `workaround` entries unless relevant to the task

During sessions:
- Write new entries when decisions are made or context is worth preserving
- Reference entries from issues: "see `.memory/YYYY-MM-DD-slug.md`"
- Never modify existing entries

## Obsidian

Open this directory (or the repo root) as a vault. Use Dataview to query:

```dataview
TABLE type, tags, created FROM ".memory"
SORT created DESC
```
