# Agent Instructions

This project uses **markdown files** in `.issues/` for issue tracking. No external tools or databases needed.

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

## Issue Tracking with `.issues/`

**IMPORTANT**: This project uses **markdown files in `.issues/`** for ALL issue tracking. Do NOT use external trackers, databases, or CLI tools.

### Structure

```
.issues/
  open/       # active issues (YAML frontmatter + description)
  closed/     # completed issues (git mv from open/)
```

### Issue Format

Each issue is a markdown file with YAML frontmatter:

```yaml
---
id: abc
title: "Issue title"
type: task|feature|bug|epic
priority: 1      # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []   # IDs of blocking issues
created: 2026-03-21
---

Description of the issue...
```

### File Naming

`P{priority}-{id}-{slug}.md` — e.g., `P1-sob-recipe-json-schema.md`

### Workflow for AI Agents

1. **Find ready work**: scan `open/` for issues with empty `depends_on` or all deps in `closed/`
2. **Read the issue**: `cat .issues/open/P1-foo.md`
3. **Work on it**: implement, test, document
4. **Discover new work?** Create a new `.issues/open/P{n}-{id}-{slug}.md` file
5. **Complete**: `git mv .issues/open/P1-foo.md .issues/closed/`

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Important Rules

- Use `.issues/` markdown files for ALL task tracking
- Issues sync automatically via git push/pull — no special sync needed
- Link dependencies using the `depends_on` array in frontmatter
- Do NOT create markdown TODO lists outside `.issues/`

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
