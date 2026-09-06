# Agent Instructions

## Issue tracking (finePrint)

Track work in **`.issues/`** — markdown files with YAML frontmatter (`open/` and `closed/`). Full schema, categories, dependency conventions, and shortHand phrases: **`docs/finePrint.md`**.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Distill** — write a `.memory/` entry (decisions, context, open questions); see `docs/finePrint.md` § shortHand — Session. See `CLAUDE.md` § Session Completion.
2. **File issues** for remaining work — add or update `.issues/open/*.md` as needed
3. **Run quality gates** (if code changed) — tests, linters, builds (`npm run validate`)
4. **Update issue status** — move completed issues to `closed/`
5. **PUSH TO REMOTE** — this is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
6. **Clean up** — clear stashes, prune remote branches
7. **Verify** — all changes committed AND pushed, and a `.memory/` entry exists for this session
8. **Hand off** — provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds
