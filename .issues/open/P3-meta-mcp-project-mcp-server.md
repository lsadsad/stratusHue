---
id: mcp
category: meta
title: "MCP server for project-aware Claude Code sessions"
type: feature
priority: 3
status: open
depends_on: []
created: 2026-03-28
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

## Design status

Brainstorming in progress — approach and scope TBD.
