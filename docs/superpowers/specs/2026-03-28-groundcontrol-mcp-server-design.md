# groundControl — Project-Aware MCP Server

**Date:** 2026-03-28
**Status:** Approved
**Goal:** Give Claude Code structured, typed access to project state across repos — replacing ad-hoc file reads with queryable tools.

## Context

Working in Claude Code today, project knowledge (issues, memory, build health, git state) is accessed through raw file reads and bash commands. This works but is slow, unstructured, and requires Claude to know each project's conventions. groundControl is an MCP server that makes this knowledge first-class — queryable, filterable, and actionable.

## Product Vision

groundControl is a **personal developer command center** built in three phases:

| Phase | Deliverable | Access |
|---|---|---|
| **1 (now)** | MCP server | Claude Code CLI |
| **2 (next)** | Web UI with chat + dashboard panels | Browser (desktop + mobile) |
| **3 (north star)** | External integrations (Figma, Notion, calendar, Obsidian) | Browser + integrations |

Phase 2's web UI embeds a Claude API-powered chat agent connected to the same MCP server, surrounded by live dashboard panels (issue boards, build status, file trees, context visualization). This is not a terminal replica — it's a designable canvas with conversation at its center.

Phase 3 adds external service integrations and Obsidian compatibility as tool providers.

This spec covers **Phase 1 only**.

## Architecture

### Repository

Standalone repo: `groundControl` (separate from stratusHue or any project it monitors).

```
groundControl/
  packages/
    mcp-server/         ← Phase 1
    web/                ← Phase 2 (placeholder)
  package.json          ← workspace root
```

Monorepo with workspaces from day one. Only `packages/mcp-server/` is built in Phase 1. Shared types will emerge in Phase 2 when two packages actually need them — no `shared/` package until then.

### Stack

- TypeScript throughout
- Node.js runtime
- `@modelcontextprotocol/sdk` for MCP protocol
- esbuild for bundling
- vitest for testing

### How It Runs

groundControl starts automatically when Claude Code opens, configured globally in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "groundControl": {
      "command": "node",
      "args": ["/path/to/groundControl/packages/mcp-server/dist/index.js"]
    }
  }
}
```

Global config means groundControl is available in every Claude Code session, not just specific projects.

## Configuration

### Project Registry

`~/.groundcontrol/config.json`:

```json
{
  "projects": [
    {
      "name": "stratusHue",
      "path": "/Users/levinsadsad/Documents/GitHub/stratusHue",
      "features": ["issues", "memory", "git", "build"]
    }
  ]
}
```

Each project entry declares which features to enable. A repo without `.issues/` can omit the `issues` feature — no errors, those tools just aren't available for that project.

## MCP Server — Tools

### Project Tools

| Tool | Parameters | Returns |
|---|---|---|
| `list-projects` | — | All registered projects with health summary |
| `project-health` | `project` | Build freshness, test status, open issue count, git state |

### Issue Tools

| Tool | Parameters | Returns |
|---|---|---|
| `list-issues` | `project`, `status?`, `category?`, `priority?` | Filtered issue list with frontmatter fields |
| `get-issue` | `project`, `id` | Full issue body + dependency graph |
| `create-issue` | `project`, `id`, `title`, `category`, `type`, `priority`, `depends_on?`, `body` | Creates `.issues/open/P{n}-{category}-{id}-{slug}.md` |
| `update-issue` | `project`, `id`, `priority?`, `depends_on?`, `title?` | Updates frontmatter fields via `gray-matter` (body preserved) |
| `close-issue` | `project`, `id` | Moves file from `open/` to `closed/`, sets `status: closed` |
| `reopen-issue` | `project`, `id` | Moves file from `closed/` to `open/`, sets `status: open` |
| `ready-issues` | `project` | Issues with no unresolved dependencies |

**Issue ID uniqueness:** IDs must be globally unique across all categories within a project. `create-issue` validates this and rejects duplicates.

**Slug generation:** The filename slug is derived from `title` via kebab-case conversion, truncated to 40 characters (e.g., title "Recipe JSON schema definition" → slug `recipe-json-schema-definition`).

**Frontmatter editing:** All tools that modify frontmatter use `gray-matter` to parse only the YAML block between `---` delimiters. The markdown body below the frontmatter is preserved untouched. Field ordering follows the schema order defined in CLAUDE.md.

### Memory Tools

| Tool | Parameters | Returns |
|---|---|---|
| `list-memory` | `project` | All memory entries with dates and slugs |
| `search-memory` | `project`, `query` | Entries matching query text |
| `save-memory` | `project`, `slug`, `body` | Creates `.memory/YYYY-MM-DD-{slug}.md` |

### Git Tools

| Tool | Parameters | Returns |
|---|---|---|
| `git-summary` | `project`, `limit?` (default 10) | Branch, recent commits, dirty/clean, ahead/behind remote |

## MCP Server — Resources

| Resource URI | Provides |
|---|---|
| `project://{name}/roadmap` | The project's `ROADMAP.md` |
| `project://{name}/claude-md` | The project's `CLAUDE.md` |

## Design Principles

### Files Are the Source of Truth

groundControl reads and writes the same markdown files your existing conventions use (`.issues/`, `.memory/`, YAML frontmatter). It does not introduce its own database. Obsidian, manual editing, and groundControl all coexist on the same files.

### Feature Flags, Not Assumptions

Each project declares what it supports. A project without `.memory/` simply doesn't expose memory tools. No errors, no fallback heuristics.

### Read-Heavy, Write-Light

Most tools read state. Write operations (create/update/close issues, save memory) follow existing file conventions exactly — same frontmatter schema, same directory structure, same naming patterns.

## Error Handling

| Scenario | Behavior |
|---|---|
| Project directory missing | Skip project, surface warning in `list-projects` |
| `.issues/` or `.memory/` missing | Disable those tools for that project |
| Malformed YAML frontmatter | Report file as unparseable, don't skip silently |
| Feature not enabled for project | Tool returns clear "not enabled" message |

## Performance

- All file reads are on-demand — no background polling or watchers
- Issue and memory directories are small (tens of files) — no caching layer needed
- Git state via shell commands, not libgit2 — simple and sufficient

## Boundaries — What groundControl Is NOT

- **Not a CI/CD system** — reads build output, does not run builds
- **Not a git client** — reports git state, does not push/pull/merge
- **Not an IDE** — the web UI (Phase 2) can invoke tools, but heavy editing stays in the editor

## Security (Phase 2 Considerations)

Noted here so they're not afterthoughts when building the web UI:

- **Authentication** — required even on localhost; the web UI exposes repo contents and an AI agent
- **API key management** — Claude API keys never stored in frontend, never committed
- **Network exposure** — localhost-only by default; mobile access via tunnel or hosted deployment raises the security bar significantly
- **Scope control** — chat agent permissions (read-only vs. write, destructive operations gated behind confirmation)

## Project Health Heuristics

`project-health` derives build and test status without running commands:

- **Build freshness:** Compare `mtime` of `dist/` directory against the newest source file in `src/`. Reports "stale" if source is newer, "fresh" otherwise, with relative time (e.g., "2m ago").
- **Test status:** Read from `.groundcontrol/cache/test-result.json` in the project root — a lightweight JSON file (`{ "passed": true, "timestamp": "...", "duration": "..." }`) written by a post-test hook. If the cache file is missing, report "unknown".

Projects opt into these via the `build` feature flag.

## Testing Strategy

Integration tests with temporary directories are the highest-value tests for Phase 1:

- Create temp project directories with `.issues/`, `.memory/`, and git repos
- Exercise each tool against real file structures
- Verify frontmatter parsing, file creation/moves, and error cases (missing dirs, malformed YAML)
- Use vitest with `fs` operations on temp dirs — no mocking the filesystem

Unit tests for slug generation, frontmatter parsing, and config loading.

## Future Phases (Out of Scope)

Documented for context, not committed to:

- **Phase 2:** Web UI with Claude API chat + dashboard panels (issue board, build status, file tree, context visualization, scroll minimap). Accessible from mobile.
- **Phase 3:** Integration layer — Figma, Notion, calendar, Obsidian as additional tool providers.
- **Obsidian compatibility:** groundControl's file conventions already support Obsidian. Deeper integration (sync, Dataview queries, vault config) is a Phase 3 concern.
- **relay-kb crossover:** Explore shared concepts between groundControl, stratusHue, and the relay-kb design system methodology.
- **Status line:** A terminal status line (`~/.claude/statusline.sh`) showing persistent project state in Claude Code. Independent of the MCP server — a complementary feature to be specced separately.
