# Memory System Design

## Problem

AI agents lose context between sessions. Beads had a "memories" feature (`bd remember`) backed by Dolt, but Dolt's cross-machine sync was unreliable — schema mismatches, corrupt journals, restore failures. We need persistent project knowledge that:

- Survives session boundaries and conversation compaction
- Syncs seamlessly between machines (work + personal)
- Is readable by any AI agent without special tooling
- Works with Obsidian for human browsing and querying

## Design

### Location

`.memory/` directory in the repo root. **Committed to git** — this is how it syncs between machines. No external databases, servers, or sync mechanisms. Each entry is its own file, so concurrent edits on different machines produce no merge conflicts (git auto-merges new files).

### Entry format

Each entry is a standalone markdown file with YAML frontmatter:

```yaml
---
type: decision | question | context | workaround
tags: [scaffold, recipe, rive]
created: 2026-03-25
---

Plain prose content. No enforced internal structure.
```

**Recommended structure by type** (not enforced, but helps consistency):

- **decision** — State the choice, then the rationale. "We chose X because Y."
- **question** — State the question, then the context. "Team needs to confirm X before we can Y."
- **context** — Lead with the key findings, then supporting detail.
- **workaround** — State the problem, then the workaround steps.

### Types

| Type | When to use |
|---|---|
| `decision` | A design principle or choice was made, with rationale |
| `question` | Open question needing human input before work proceeds |
| `context` | Session summary, brainstorm output, findings worth preserving |
| `workaround` | Platform-specific gotchas — selective, not general tool debugging (for this project: Relay and Rive KB) |

### File naming

`YYYY-MM-DD-slug.md` — date of creation, short descriptive slug. Slugs must be unique within a date.

Examples:
- `2026-03-25-recipe-design-principle.md`
- `2026-03-25-template-audit-open-questions.md`
- `2026-03-27-beads-to-markdown-migration.md`

### Conventions

- **Append-only** — never edit an existing entry. Create a new entry that references the old one if context has evolved.
- **Superseding** — when a new entry replaces an old decision or answers an old question, include "Supersedes: `.memory/YYYY-MM-DD-old-slug.md`" in the new entry's body.
- **No index file** — agents scan the directory via glob/grep, Obsidian uses Dataview.
- **Tags are freeform** — used for Obsidian Dataview queries and agent filtering.
- **Cross-references** — entries can reference other entries or issues by relative path (e.g., "see `.memory/2026-03-25-recipe-design-principle.md`" or "related: `.issues/open/P1-sob-recipe-json-schema.md`").

### Trigger phrases

Agents respond to these natural language cues from the user:

#### Issues (`.issues/`)

| Action | Trigger phrases | Agent behavior |
|---|---|---|
| **Create** | "create an issue for X", "track this" | Write new `.issues/open/P{n}-{id}-{slug}.md` |
| **Find work** | "what's ready", "what should I work on" | Scan `open/` for issues with no unresolved `depends_on` |
| **View** | "show issue X", "what's open" | Read/list `.issues/open/` |
| **Close** | "close X", "mark X done" | `git mv .issues/open/... .issues/closed/` |
| **Prioritize** | "this is P0", "bump priority" | Rename file with new priority prefix |

#### Memory (`.memory/`)

| Action | Trigger phrases | Agent behavior |
|---|---|---|
| **Save** | "remember this", "save to memory" | Write new `.memory/YYYY-MM-DD-slug.md` |
| **Recall** | "check memory", "what do we know about X" | Grep `.memory/` by tags/filenames/content |
| **Reference** | "see memory on X" | Link to a specific entry |
| **Supersede** | "this replaces the old decision on X" | New entry with "Supersedes:" reference to old |

There is no "forget" or "edit" — the system is append-only. To correct or update, supersede.

### Agent behavior

**At session start**, agents should:
1. List `.memory/` filenames to see what's available
2. Always read `decision` and `question` type entries (these are load-bearing)
3. Read `context` entries only if their slug/tags match current work
4. Skip `workaround` entries unless the current task involves that platform

**During a session**, agents should:
- Create new entries when decisions are made, open questions are identified, or session context is worth preserving
- Never modify existing entries
- Reference memory entries from issues when relevant

**Agents should NOT:**
- Create entries for ephemeral debugging or one-off fixes
- Duplicate information already in code, git history, or `.issues/`
- Create entries for general tool troubleshooting (exception: Relay and Rive KB workarounds)

### README.md (bootstrapping)

`.memory/README.md` is the portable bootstrapping document. Any AI agent dropped into a repo containing this file understands the system without needing CLAUDE.md or AGENTS.md context. When setting up a new repo, copy `.memory/README.md` into it and the system is ready.

Contents of `.memory/README.md`:

```markdown
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

| Action | Say | What happens |
|---|---|---|
| Save | "remember this", "save to memory" | New `.memory/YYYY-MM-DD-slug.md` entry created |
| Recall | "check memory", "what do we know about X" | Agent greps `.memory/` |
| Supersede | "this replaces the decision on X" | New entry with "Supersedes:" link |

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
```

### Integration with `.issues/`

The memory system and issue tracker are complementary:

- **`.issues/`** tracks *work to be done* — tasks, features, bugs with status and dependencies
- **`.memory/`** tracks *knowledge to be preserved* — why decisions were made, what's unresolved, what happened

Issues may reference memory entries. Memory entries may reference issues. Neither depends on the other.

### Integration with CLAUDE.md / AGENTS.md

Add a short section pointing to `.memory/README.md`:

```markdown
## Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions.
See `.memory/README.md` for format and conventions.
```

## Migration

### Beads memories → `.memory/` entries

Migrate 3 of the 4 existing beads memories:

1. `2026-03-25-recipe-design-principle.md` (type: decision, tags: [recipe, scaffold])
2. `2026-03-25-template-audit-open-questions.md` (type: question, tags: [template, scaffold])
3. `2026-03-25-template-audit-completed.md` (type: context, tags: [template, scaffold])
4. `2026-03-25-beads-cross-machine-sync.md` — **do not migrate** (beads-specific workaround, no longer relevant)

### CLAUDE.md / AGENTS.md cleanup

- Remove any remaining `bd remember` / `bd memories` references
- Remove "do NOT use MEMORY.md files" instruction (the new system IS markdown files)
- Add the `.memory/` section pointing to README.md

### Auto-memory disposition

The existing Claude Code auto-memory at `~/.claude/projects/.../memory/MEMORY.md` should be left in place but its useful content migrated to `.memory/` entries. CLAUDE.md should instruct agents to use `.memory/` instead. The auto-memory file is managed by Claude Code infrastructure and will be ignored, not deleted.

## What this replaces

- `bd remember` / `bd memories` (beads persistent memory)
- `MEMORY.md` files in `.claude/` (auto-memory system — agents instructed to use `.memory/` instead)
- Any other ad-hoc knowledge persistence

## Out of scope

- Cross-repo shared memory (future — could be a separate shared vault)
- Automated pruning or compaction (revisit if directory exceeds ~100 entries)
- Structured query API beyond grep/glob/Dataview
