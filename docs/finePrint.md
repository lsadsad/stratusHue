# finePrint — Issue & Memory Conventions

How issues, memory, and shortHand phrases work in stratusHue. Extracted from root `CLAUDE.md` to keep the operating layer focused.

See also: [groundControl CLAUDE.md](https://github.com/lsadsad/groundControl/blob/main/CLAUDE.md) — shortHand phrases, MCP prompts, and agent tools are maintained there and re-used across projects.

---

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
id: sch              # short mnemonic ID (3 chars; 4 for epics)
category: scaffold   # feature area (see categories below)
title: "..."
type: task|feature|bug|epic
priority: 1          # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []       # list of IDs this issue is blocked by
created: 2026-03-21
---
```

### Categories

| Category | Description |
|---|---|
| `plugin` | Core plugin infrastructure — build, sandbox/UI boundary, message passing, modes, shared UI shell |
| `scaffold` | Scaffold mode — recipe schema, engine, UI, sharing |
| `validate` | Validate mode — lint engine, token audit, component check, readiness |
| `navigate` | Navigate mode — bookmarks, emoji nav, controls, anatomy |
| `prototype` | Prototype system — shim, `sync-prototype`, `prototype/plugin.html` |
| `meta` | Cross-cutting — audits, process, infrastructure, releases |

### Conventions

- File naming: `P{priority}-{category}-{id}-{slug}.md` (e.g., `P2-scaffold-sch-recipe-json-schema.md`)
- To close an issue: `git mv .issues/open/P2-scaffold-sch-*.md .issues/closed/`
- To find ready work: issues in `open/` with empty `depends_on` or all deps in `closed/`
- Dependencies reference other issue IDs (check `depends_on` arrays)
- Obsidian-compatible: open `.issues/` as a vault, use Dataview for queries
- See `.issues/README.md` for full how-to guide

### ID naming convention

IDs should be **short, pronounceable abbreviations** — not random hashes or ticket numbers.

- **3 characters** for regular issues, **4 characters** for epics
- Lowercase, alphanumeric only
- Must be globally unique within the project

### Display Layouts

Issues support two display layouts. Both use tree characters to visualize dependency chains — nested items are blocked by their parent.

**Priority view (default)** — groups by priority level, dependencies nest under blockers:

```
■ Open Issues (17)
│
│ P1
├── aud   Template methodology audit
│
│ P2
├── scf   Scaffold mode epic ⬡  ← tab, tpl, stm
├── sch   Recipe JSON schema
│   ├── exp   Recipe import/export
│   └── stm   Stamp recipe to file
├── ldr   Sandbox: recipe loader
│   ├── pgs   Create pages from recipe
│   │   └── tpl  Content templates
│   └── tab   Scaffold tab UI
├── anc   Anchors list max entries
├── pth   Pathing characters in file tree
├── rel   Cut a release
│
│ P3
├── cmp   Component check
├── rdy   Readiness check
├── tkn   Token audit
│
│ P4
├── anim-ref  Animation system reference
└── smk2  Auto-detect missing smoke tests
```

- Dependencies nest under their blocker within the same priority group
- Cross-priority deps show a `← blocker` marker instead of nesting
- `⬡` marks epics
- `[P4]` suffix when a nested item's priority differs from its group

**Location view** — groups by category (package/area), priority as suffix:

```
■ Open Issues (17)
│
│ scaffold/
├── scf   Scaffold mode epic ⬡ [P2]
│   ├── tab   Scaffold tab UI [P2]
│   ├── tpl   Content templates [P2]
│   └── stm   Stamp recipe to file [P2]
├── sch   Recipe JSON schema [P2]
│   └── exp   Recipe import/export [P2]
├── ldr   Sandbox: recipe loader [P2]
│   └── pgs   Create pages from recipe [P2]
│
│ validate/
├── cmp   Component check [P3]
├── rdy   Readiness check [P3]
├── tkn   Token audit [P3]
│
│ navigate/
├── anc   Anchors list max entries [P2]
├── pth   Pathing characters [P2]
│
│ meta/
├── aud   Template methodology audit [P1]
├── rel   Cut a release [P2]
├── anim-ref  Animation system reference [P4]
└── smk2  Auto-detect missing smoke tests [P4]
```

- Dependencies still nest under their blocker
- `[P2]` suffix shows priority per item

### shortHand — Issues

Casual phrases that drive finePrint actions. Say any of these.

| Phrase | Action |
|---|---|
| "issues plz" | List all open issues |
| "what's ready" | Show unblocked issues only |
| "show X" | Read a specific issue |
| "show deats" | Show full issue details (frontmatter + body) |
| "issue it" | Create a new issue from current context |
| "track this" | Create a new issue (with description) |
| "done X" | Close issue — `git mv` to `closed/` |
| "bump X" | Raise an issue's priority |
| "block X on Y" | Add Y to X's `depends_on` |

## finePrint — Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions. See `.memory/README.md` for full format and conventions.

### Format

Files are named `YYYY-MM-DD-slug.md` with optional YAML frontmatter. Types: `decision`, `question`, `context`, `workaround`.

### shortHand — Memory

| Phrase | Action |
|---|---|
| "save context" | Write new `.memory/YYYY-MM-DD-slug.md` |
| "check memory" | List all memory entries |
| "recall X" | Search `.memory/` for topic |
| "this replaces X" | New entry with "Supersedes:" reference |

### shortHand — Session

| Phrase | Action |
|---|---|
| "run down" | Full status report on a topic — pull together issues, memories, related context, and current state |
| "distill this" | Synthesize the session — extract decisions, milestones, and context into `.memory/` entries; update issues with progress; surface untracked work as new issues |
| "wrap up" | File issues for remaining work, run quality gates, close completed issues, commit and push |
| "ship it" | Commit all changes and push to remote |
| "what changed" | Git summary — branch, recent commits, dirty state |
