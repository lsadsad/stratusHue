# Memory System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `.memory/` append-only knowledge base and migrate existing beads memories.

**Architecture:** Plain markdown files with YAML frontmatter in `.memory/`, committed to git. README.md bootstraps the system for any AI agent. CLAUDE.md and AGENTS.md updated with trigger phrases and conventions.

**Tech Stack:** Markdown, YAML frontmatter, git

**Spec:** `docs/superpowers/specs/2026-03-27-memory-system-design.md`

---

### Task 1: Create `.memory/` directory and README.md

**Files:**
- Create: `.memory/README.md`

- [ ] **Step 1: Create `.memory/README.md`**

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

- [ ] **Step 2: Verify file exists**

Run: `cat .memory/README.md | head -5`
Expected: Shows "# Project Memory" header

- [ ] **Step 3: Commit**

```bash
git add .memory/README.md
git commit -m "feat: add .memory/ system with README bootstrapping doc"
```

---

### Task 2: Migrate beads memories

**Files:**
- Create: `.memory/2026-03-25-recipe-design-principle.md`
- Create: `.memory/2026-03-25-template-audit-open-questions.md`
- Create: `.memory/2026-03-25-template-audit-completed.md`

Source content is in the beads session hook context (4 memories). Migrate 3, skip the beads sync workaround.

- [ ] **Step 1: Create recipe design principle entry**

```markdown
---
type: decision
tags: [recipe, scaffold, validate]
created: 2026-03-25
---

Recipe = rulebook (intent), Figma file = state. Never duplicate Figma-queryable data in recipe JSON. Recipe defines what SHOULD exist and what counts as done. Plugin queries Figma at runtime for what IS. Diff between the two produces the readiness report.
```

- [ ] **Step 2: Create template audit open questions entry**

```markdown
---
type: question
tags: [template, scaffold]
created: 2026-03-25
---

Team must confirm which template elements are genuinely load-bearing before plugin encodes them. Key suspects for removal: Components in Use panel (Dev Mode does this), About This Project form (may duplicate Jira/Confluence), iTrack links (Jira integration exists), teaching tools (one-time use, Community template better), collaborator strip (Figma shows collaborators natively). Do NOT build scanner/validator until this is resolved.
```

- [ ] **Step 3: Create template audit completed entry**

```markdown
---
type: context
tags: [template, scaffold]
created: 2026-03-25
---

Template utility audit completed. Key findings: (1) Recipe should be intent/rules not state — Figma owns components, styles, variables; recipe owns structural rules, completion rules, thresholds, workflow rules. (2) Several template elements are redundant with Dev Mode (Components in Use panel, iTrack links, collaborator strip). (3) Some elements may be process theater — team needs to confirm what's actually used before we encode it as a recipe. (4) Build order should be: audit template with team → trim → design schema → build scanner.

Related issues: `.issues/open/P3-cqv-readiness-check.md`, `.issues/open/P1-sob-recipe-json-schema.md`
```

- [ ] **Step 4: Verify all 3 entries exist**

Run: `ls .memory/*.md`
Expected: README.md plus 3 dated entries

- [ ] **Step 5: Commit**

```bash
git add .memory/2026-03-25-recipe-design-principle.md .memory/2026-03-25-template-audit-open-questions.md .memory/2026-03-25-template-audit-completed.md
git commit -m "feat: migrate beads memories to .memory/ entries"
```

---

### Task 3: Update CLAUDE.md with `.memory/` and `.issues/` trigger phrases

**Files:**
- Modify: `CLAUDE.md` (add memory section after the issue tracking section)

- [ ] **Step 1: Add memory section to CLAUDE.md**

Add after the "Issue Tracking (`.issues/`)" section and before "Session Completion":

```markdown
## Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions. Use `.memory/` for all persistent knowledge — do NOT use `bd remember` or `MEMORY.md` files. See `.memory/README.md` for full format and conventions.

### Trigger phrases

- "remember this" / "save to memory" → write new `.memory/YYYY-MM-DD-slug.md`
- "check memory" / "what do we know about X" → grep `.memory/`
- "this replaces the decision on X" → new entry with "Supersedes:" reference
```

Also add trigger phrases to the existing "Issue Tracking (`.issues/`)" section:

```markdown
### Trigger phrases

- "create an issue for X" / "track this" → write new `.issues/open/P{n}-{id}-{slug}.md`
- "what's ready" / "what should I work on" → scan `open/` for unblocked issues
- "show issue X" / "what's open" → read/list `.issues/open/`
- "close X" / "mark X done" → `git mv .issues/open/... .issues/closed/`
```

- [ ] **Step 2: Verify CLAUDE.md has the new section**

Run: `grep -n "Project Memory" CLAUDE.md`
Expected: Shows the new section heading with line number

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add .memory/ and trigger phrases to CLAUDE.md"
```

---

### Task 4: Update AGENTS.md with `.memory/` section

**Files:**
- Modify: `AGENTS.md` (add memory section after issue tracking)

- [ ] **Step 1: Add memory section to AGENTS.md**

Add after the "Important Rules" list in the issue tracking section, before "Session Completion":

```markdown
## Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions. Use `.memory/` for all persistent knowledge. See `.memory/README.md` for full format and conventions.

### Agent behavior at session start

1. List `.memory/` filenames
2. Always read `decision` and `question` entries
3. Read `context` entries if tags/slug match current work
4. Skip `workaround` entries unless relevant to the task

### Trigger phrases

- "remember this" → write `.memory/YYYY-MM-DD-slug.md`
- "check memory" / "what do we know about X" → grep `.memory/`
- "this replaces the decision on X" → new entry with "Supersedes:" reference
```

- [ ] **Step 2: Verify AGENTS.md has the new section**

Run: `grep -n "Project Memory" AGENTS.md`
Expected: Shows the new section heading with line number

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add .memory/ section and trigger phrases to AGENTS.md"
```

---

### Task 5: Update copilot-instructions.md

**Files:**
- Modify: `.github/copilot-instructions.md` (add brief memory pointer)

- [ ] **Step 1: Add memory reference**

Add after the "Issue Tracking" line:

```markdown
Project memory in `.memory/` — see `.memory/README.md`. Append-only, never edit entries.
```

- [ ] **Step 2: Commit**

```bash
git add .github/copilot-instructions.md
git commit -m "docs: add .memory/ reference to copilot instructions"
```

---

### Task 6: Clean up auto-memory references

**Files:**
- Check: `~/.claude/projects/-Users-levinsadsad-Documents-GitHub-stratusHue/memory/MEMORY.md`

- [ ] **Step 1: Verify auto-memory content has been migrated**

Read the auto-memory file. Confirm that any useful content is now covered by `.memory/` entries or is already in CLAUDE.md. The auto-memory file is managed by Claude Code infrastructure — leave it in place but agents will be instructed via CLAUDE.md to use `.memory/` instead.

- [ ] **Step 2: No commit needed** (external file, not in repo)
