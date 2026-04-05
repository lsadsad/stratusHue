---
id: mcp
category: meta
title: FTR — MCP server for project-aware Claude Code sessions
type: feature
priority: 3
status: closed
depends_on: []
created: 2026-03-28T00:00:00.000Z
---

Build a local MCP server that gives Claude Code structured, typed access to stratusHue project state — issues, memory, build health, git context — instead of ad-hoc file reads and grep.

## Motivation

Claude Code can already read files, but an MCP server makes project state queryable, fast, and proactive. Instead of grepping `.issues/open/` and parsing YAML frontmatter, Claude gets structured tools like `list-issues(status, category, priority)` or `project-health()`.

## Potential capabilities

- Query issues with filters (status, category, priority, blocked/unblocked)
- Create, update, close issues through typed tools
- Read/write `.memory/` entries as structured data
- Project health dashboard (build freshness, test status, open issue count)
- Surface unblocked issues and stale memory proactively

## Resolution

Built as standalone repo: `groundControl` (github.com/lsadsad/groundControl). Multi-project MCP server with 14 tools covering issues, memory, git, build health, and project scaffolding. Registered globally via `claude mcp add`. stratusHue is the first registered project. See spec at `docs/superpowers/specs/2026-03-28-groundcontrol-mcp-server-design.md`.
