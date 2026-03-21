# Beads Context Sync: Personal → Work

How to transfer issues, notes, and session logs between machines.

## The problem

The Dolt database (`.beads/dolt/`) is machine-local. Even though the repo is checked out on both machines, the database doesn't exist on a new machine until it's initialised.

---

## Recommended flow (git-based backup)

### On the source machine (before switching)

```bash
bd backup export-git   # publishes snapshot to beads-backup branch
git push               # push code changes
```

The `beads-backup` branch now contains all issues, notes, and session logs as JSONL.

### On the destination machine (first time)

```bash
git pull
bd init --skip-hooks --skip-agents   # creates the local Dolt database
bd backup fetch-git                  # restores all issues and logs from the snapshot
bd ready                             # verify issues loaded correctly
```

### On the destination machine (subsequent syncs)

```bash
git pull
bd backup fetch-git   # pull latest snapshot and restore
```

---

## Keeping them in sync day-to-day

`/wrap` handles this automatically — Step 8 runs `bd backup export-git` at the end of every session, so the snapshot is always current before you switch machines.

---

## What transfers

- All open/closed issues and their descriptions
- Session notes and decision logs (`--append-notes` history)
- Checklist progress
- Dependencies and priorities

## What does NOT transfer

- The Dolt commit history (snapshot is a point-in-time export, not a full clone)
- In-flight `in_progress` work that wasn't written back before export

---

## Troubleshooting

**"database stratusHue not found on Dolt server"**
The database hasn't been initialised yet. Run `bd init --skip-hooks --skip-agents` first, then retry `bd backup fetch-git`.

**`bd init` fails / Dolt server not running**
`bd` auto-starts the Dolt server on first use. If it fails, check `dolt` is on PATH:
```bash
which dolt
dolt version
```

**Changes on work machine not making it back**
Run `bd backup export-git && git push` before leaving the work machine. Then `git pull && bd backup fetch-git` on the personal machine.
