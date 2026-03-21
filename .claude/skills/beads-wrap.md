# /wrap — Beads Session Wrap

## Purpose
End-of-session skill. Automatically updates the active Beads issue with:
1. Inline checklist progress (items confirmed done by commit evidence)
2. A timestamped session note (decisions + next session briefing)

Invoke with `/wrap` at the end of any working session.

---

## Trigger Phrases
- "wrap"
- "wrap this session"
- "end session"
- "/wrap"

---

## Step 1: Detect Beads

Check for `.beads/` in the current working directory:

```bash
ls .beads/ 2>/dev/null
```

- **If `.beads/` not found:** skip to **Fallback (no Beads)** at the bottom.
- **If `.beads/` found:** run `bd list` to verify `bd` is working:

```bash
bd list
```

- **If `bd` fails** (not on PATH, DB corrupt, any error): report clearly —
  > "Beads directory found but `bd` command failed: [error]. Falling back to plain-text synthesis."
  Then skip to **Fallback (no Beads)**.
- **If `bd` succeeds:** continue to Step 2.

---

## Step 2: Find the Active Issue

Filter `bd list` output for `in_progress` issues:

- **One in_progress issue:** use it.
- **Multiple in_progress issues:** run `bd show <id>` on each and use the one with the most recent "Updated" timestamp.
- **No in_progress issues:** produce the session note as plain text (see **Write 2** format), then offer:
  > "No in_progress issue found. Here's your session note — run `bd update <id> --append-notes '...'` to attach it to an issue."

---

## Step 3: Determine the Session Window

Read the active issue's full content to find the most recent prior session marker. **Save the full output verbatim — you will need it for the conflict check in Step 6.**

```bash
bd show <issue-id>
```

Look for the most recent `## Session YYYY-MM-DD` heading in the output.

- **If a prior session note exists:** session window = commits since that date (i.e., `--after="YYYY-MM-DD 00:00:00"`).
- **If no prior session notes exist:** session window = commits from today's date only (`--after="today 00:00:00"`). This is intentional — only today's work is attributed to this session.

This date is the anchor for the git log query.

---

## Step 4: Read Inference Sources

### Source 1 — Git log (primary evidence)

```bash
git log --oneline --after="YYYY-MM-DD 00:00:00"
git log --stat --after="YYYY-MM-DD 00:00:00"
```

Use the session window date from Step 3. If `git log` fails (no git repo, or working directory is outside a repo), note the failure and skip to Step 7 — produce the session note based on conversation context alone, with "Nothing confirmed via commits (no git repo)" in the Completed section.

### Source 2 — Active issue (baseline)

From the `bd show` output saved in Step 3, extract:
- Current checklist state (which items are already `[x]`)
- Current description text (already saved verbatim — this is your conflict-check baseline)

### Source 3 — Plan files (supplementary context)

If the issue's NOTES field references plan files (e.g., `docs/superpowers/plans/...`), read them to map plan step names to checklist item names.

**Plan files are supplementary only.** Their existence is not evidence of completion. Only commit messages and diffs are evidence.

---

## Step 5: Determine What Was Completed

For each unchecked checklist item in the issue description:
- Search the git log (commit messages + file paths from `--stat`) for evidence this item was completed.
- **Mark `[x]` only if commit evidence exists.**
- If no commit evidence → leave unchecked.

Examples of good evidence:
- Commit message contains the item name or a clear synonym
- Commit diff touches a file named in the plan step for that item
- Commit message references the plan task number

When in doubt, leave unchecked. Do not guess.

---

## Step 6: Write 1 — Update Checklist (with safety check)

**Re-read the issue immediately before writing:**

```bash
bd show <issue-id>
```

Compare this fresh output to the version saved in Step 3.

- **If the description changed:** do NOT write. Report:
  > "Issue description was modified externally — skipping checklist update to avoid overwriting changes. Session note still written."
  Skip to Step 7.

- **If unchanged:** construct the full updated description string with `[ ]` → `[x]` for confirmed items, then write using a heredoc to avoid shell escaping issues:

```bash
bd update <issue-id> --description "$(cat <<'BEADS_EOF'
<full updated description here>
BEADS_EOF
)"
```

`bd update --description` is a full replace — pass the complete description, not a patch.

**If the `bd update` write fails:** report the error and continue to Step 7. Session note must still be written.

---

## Step 7: Write 2 — Append Session Note

Append a timestamped note to the issue. Include the issue ID and title at the top for readability outside the issue context.

**Decisions guidance:** A "decision" is a concrete choice agreed upon this session — an approach selected, a design constraint set, a scope call made. Extract these from the conversation. Do not include open questions or general discussion. When in doubt, use the definition: "Concrete choices that were agreed upon." Omit the Decisions section entirely if no decisions were made.

**Note format:**

```
[<issue-id> — <issue title>]
## Session YYYY-MM-DD

### Completed
- [x] <item confirmed done by commit evidence>
(or: "Nothing confirmed via commits this session")

### Decisions
- <decision> — <rationale>
(omit this section if no decisions were made)

### Next Session
Pick up at: <first unchecked item in the updated checklist>
Context: <one sentence — what's done, what's blocking, what's next>
```

**If all checklist items are now complete:**
```
### Next Session
All checklist items complete — issue ready to close (`bd close <id>`)
```

Write using `--append-notes` (appends to existing notes, does not replace):

```bash
bd update <issue-id> --append-notes "$(cat <<'BEADS_EOF'
<session note content here>
BEADS_EOF
)"
```

**If this write fails:** output the session note as plain text so the work is not lost. Report the error.

After writing (or attempting to write) the session note, offer:
> "Any memory candidates from this session worth saving to long-term memory? I can save them before we close."

---

## Fallback (no Beads)

If `.beads/` not found or `bd` command failed, produce plain-text synthesis output:

**Issue: <issue ID and title if identifiable from conversation, otherwise omit>**

### Key Breakthroughs
Moments where a new insight clicked or a problem was solved in a new way.

### Decisions Made
Concrete choices agreed upon this session.

### Open Action Items
Things that still need to happen. Include owner if clear.

### Memory Candidates
Anything worth saving to long-term memory. Ask before saving.

---

## What This Skill Does NOT Do

- Does not close issues (user decides)
- Does not create new issues
- Does not mark items done without commit evidence
- Does not prompt the user for input mid-run
- Does not push to Beads remote (`bd dolt push` is manual)
- Does not overwrite externally-modified descriptions
