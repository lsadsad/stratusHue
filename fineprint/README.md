# finePrint

A plain-text project tracking system for AI-assisted development.

Issues and memories live as markdown files in git — no external tools, no
databases, no SaaS. Every decision, task, and open question travels with
your code. Connect multiple repos to a single Obsidian vault for a
cross-project command center.

```
 ┌─────────────────────────────────────────────┐
 │              f i n e P r i n t              │
 │                                             │
 │   .issues/          .memory/                │
 │     open/             decisions             │
 │     closed/           questions             │
 │                       context               │
 │   plain markdown ─ tracked in git           │
 │   works with AI agents + Obsidian           │
 └─────────────────────────────────────────────┘
```

## What's inside

```
fineprint/
  README.md                  # you are here
  AI_AGENT_REFERENCE.md      # concise operating reference for AI agents
  template/
    .issues/
      README.md              # issue tracking how-to
      open/.gitkeep
      closed/.gitkeep
    .memory/
      README.md              # project memory how-to
    CLAUDE-SNIPPET.md        # paste into your CLAUDE.md
  scripts/
    fp-init.sh               # install finePrint into any repo
    fp-obsidian-link.sh      # symlink repos into an Obsidian vault
```

## Quick setup

### Option A: script (recommended)

```bash
# from inside any git repo
bash /path/to/fineprint/scripts/fp-init.sh

# or clone just the kit
git clone <repo> --sparse --filter=blob:none
cd <repo> && git sparse-checkout set fineprint
bash fineprint/scripts/fp-init.sh /path/to/target/repo
```

### Option B: manual

1. Copy `template/.issues/` and `template/.memory/` into your repo root
2. Paste the contents of `template/CLAUDE-SNIPPET.md` into your `CLAUDE.md`
3. Commit

## Obsidian multi-repo vault

Link all your repos into one Obsidian vault for cross-project visibility:

```bash
# one-time setup
bash fineprint/scripts/fp-obsidian-link.sh ~/my-obsidian-vault ~/code/repo-a ~/code/repo-b
```

This creates:

```
~/my-obsidian-vault/
  finePrint/
    repo-a/
      issues/    → symlink → ~/code/repo-a/.issues/
      memory/    → symlink → ~/code/repo-a/.memory/
    repo-b/
      issues/    → symlink → ~/code/repo-b/.issues/
      memory/    → symlink → ~/code/repo-b/.memory/
  .obsidian/
    (your vault config)
```

Then use Dataview to query across all repos:

```dataview
TABLE title, category, priority, status, depends_on
FROM "finePrint"
WHERE status = "open"
SORT priority ASC
```

See `scripts/fp-obsidian-link.sh` for details.

## The name

**finePrint** — three meanings:

1. **fine print** — the crucial details you actually need to read
2. **fine** — refined, precise (design quality)
3. **print** — typography, published output (the permanent record)

Every project has fine print. This system makes sure it's written down.

## Agent reference

For a concise, repo-friendly operating guide for future AI agents, see
`fineprint/AI_AGENT_REFERENCE.md`.
