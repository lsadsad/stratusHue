# groundControl MCP Server — Built and Live

groundControl is a standalone MCP server (separate repo: github.com/lsadsad/groundControl) that gives Claude Code structured access to project state across repos. stratusHue is a registered project.

## What it provides for stratusHue

- `list-issues`, `get-issue`, `create-issue`, `update-issue`, `close-issue`, `reopen-issue`, `ready-issues` — query and manage `.issues/`
- `list-memory`, `search-memory`, `save-memory` — query and manage `.memory/`
- `git-summary` — branch, commits, dirty state
- `project-health` — build freshness, test status, issue count
- `scaffold-project` — bootstrap finePrint conventions in new repos

## Config

Registered in `~/.groundcontrol/config.json` with features: issues, memory, git, build.
Starts automatically in every Claude Code session via `~/.claude.json`.

## Future

Phase 2 adds a web UI with chat + dashboard. Phase 3 adds Figma/Notion/calendar integrations. See groundControl's `.issues/open/` for the full roadmap.
