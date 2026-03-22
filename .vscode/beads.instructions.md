---
applyTo: "**"
---

# Beads (bd) Issue Tracker — stratusHue

This project uses **bd (beads)** for all issue tracking. Do NOT use markdown TODOs, GitHub issues, or any other tracking system.

## CLI Reference

```bash
# Find work
bd ready                          # unblocked issues (start here)
bd ready --json
bd list --json                    # all issues

# Inspect
bd show <id>
bd show <id> --json

# Claim atomically
bd update <id> --claim --json

# Update
bd update <id> --status in-progress
bd update <id> --priority 1
bd update <id> --description "New description"

# Create
bd create "Title" --description="Context" -t bug|feature|task|epic|chore -p 0-4 --json
bd create "Title" --description="Details" --deps discovered-from:<parent-id> --json

# Close
bd close <id> --reason "Done" --json

# Sync
bd dolt push
bd dolt pull
```

## Priorities
- `0` Critical · `1` High · `2` Medium (default) · `3` Low · `4` Backlog

## Agent Workflow
1. `bd ready` — find unblocked work
2. `bd update <id> --claim` — claim atomically
3. Implement
4. Discover new work? `bd create "..." --deps discovered-from:<id>`
5. `bd close <id> --reason "Done"`
6. `bd dolt push`

## Session Close (MANDATORY)
```bash
git pull --rebase
bd dolt push
git push
git status  # must show "up to date with origin"
```

## Key IDs (stratusHue)
- `stratusHue-sob` — Recipe JSON schema (unblocked, foundational)
- `stratusHue-xq7` — Recipe loader/parser (unblocked, foundational)

Run `bd ready` to see current unblocked queue.
