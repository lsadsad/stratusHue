# Agent Instructions

This project uses **finePrint** conventions for issue tracking (`.issues/`) and **shortHand** casual phrases for agent interaction.

See **CLAUDE.md** for the canonical reference: issue schema, categories, priorities, file naming, shortHand phrase tables, memory conventions, and session workflows.

## Quick Reference

```bash
ls .issues/open/           # See open issues
cat .issues/open/P1-*.md   # Read high-priority issues
git mv .issues/open/P1-foo.md .issues/closed/  # Close an issue
```

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

## Issue Tracking and Memory

See **CLAUDE.md** for full finePrint issue schema, memory conventions, and all shortHand phrases.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create new `.issues/open/*.md` files
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Move completed issues to `closed/`
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- If push fails, resolve and retry until it succeeds
