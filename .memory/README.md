# Project Memory

Append-only knowledge base for decisions, open questions, session context, and
selective workarounds. Read by AI agents at session start; written by agents
and humans when context is worth preserving across sessions.

Synced via git — committed to the repo, not gitignored.

## Entry format

Each file is `YYYY-MM-DD-slug.md` with YAML frontmatter:

    ---
    type: decision | question | context | workaround
    tags: [topic1, topic2]
    created: YYYY-MM-DD
    ---

    Plain prose content.

## Types

| Type | Use when |
|---|---|
| decision | A design choice was made — include rationale |
| question | Open question blocking or informing work — needs human input |
| context | Session summary, brainstorm output, findings worth keeping |
| workaround | Platform-specific gotchas (selective, not general debugging) |

## Rules

- **Append-only**: never edit an existing entry. Write a new one that references it.
- **Superseding**: include "Supersedes: `.memory/old-entry.md`" when replacing a decision or answering a question.
- **File naming**: `YYYY-MM-DD-slug.md` (slugs unique within a date)
- **Tags**: freeform, for filtering and Obsidian Dataview queries
- **No index file**: scan the directory or use Dataview
- **Don't duplicate**: if it's in git history, code, or issues, don't repeat it here

## Trigger phrases

| Shortcut | Natural language | What happens |
|---|---|---|
| `/memory` | "check memory" | List all memory entries |
| `/recall X` | "what do we know about X" | Grep `.memory/` for topic |
| `/remember` | "remember this", "save to memory" | New `.memory/YYYY-MM-DD-slug.md` entry created |
| `/supersede X` | "this replaces the decision on X" | New entry with "Supersedes:" link |

No "forget" or "edit" — append-only. Supersede instead.

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
