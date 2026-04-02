# groundControl MCP Server — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal MCP server that gives Claude Code structured tools for querying and managing project state (issues, memory, git, build health) across repos.

**Architecture:** Standalone monorepo with a single `packages/mcp-server/` package in Phase 1. The server uses `@modelcontextprotocol/sdk` with stdio transport, reads a project registry from `~/.groundcontrol/config.json`, and operates on plain markdown files (`.issues/`, `.memory/`) as the source of truth. No database.

**Tech Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, `gray-matter`, `zod`, esbuild, vitest

**Spec:** `docs/superpowers/specs/2026-03-28-groundcontrol-mcp-server-design.md`

---

## File Structure

```
groundControl/
  packages/
    mcp-server/
      src/
        index.ts                  ← entry point: create server, register tools, connect stdio
        config.ts                 ← load ~/.groundcontrol/config.json, validate with zod
        types.ts                  ← ProjectConfig, IssueData, MemoryEntry, HealthReport types
        utils/
          slugify.ts              ← title → kebab-case slug (max 40 chars)
          frontmatter.ts          ← gray-matter parse/stringify helpers
          git.ts                  ← shell out to git, parse output
          build-health.ts         ← mtime comparison, test result cache reading
        tools/
          project-tools.ts        ← list-projects, project-health
          issue-tools.ts          ← list-issues, get-issue, create-issue, update-issue, close-issue, reopen-issue, ready-issues
          memory-tools.ts         ← list-memory, search-memory, save-memory
          git-tools.ts            ← git-summary
        resources/
          project-resources.ts    ← project://{name}/roadmap, project://{name}/claude-md
      tests/
        helpers/
          test-project.ts         ← create/teardown temp project dirs with .issues/, .memory/, git
        config.test.ts
        slugify.test.ts
        frontmatter.test.ts
        issue-tools.test.ts
        memory-tools.test.ts
        git-tools.test.ts
        build-health.test.ts
        project-tools.test.ts
        project-resources.test.ts
        server-integration.test.ts
      package.json
      tsconfig.json
      esbuild.config.js
      vitest.config.ts
  package.json                    ← workspace root
  .gitignore
  CLAUDE.md
```

---

## Task 1: Repository Scaffold

**Files:**
- Create: `groundControl/package.json`
- Create: `groundControl/.gitignore`
- Create: `groundControl/packages/mcp-server/package.json`
- Create: `groundControl/packages/mcp-server/tsconfig.json`
- Create: `groundControl/packages/mcp-server/vitest.config.ts`
- Create: `groundControl/packages/mcp-server/esbuild.config.js`

- [ ] **Step 1: Create the repo directory and workspace root**

```bash
mkdir -p ~/Documents/GitHub/groundControl/packages/mcp-server/src
cd ~/Documents/GitHub/groundControl
git init
```

- [ ] **Step 2: Write workspace root `package.json`**

```json
{
  "name": "groundcontrol",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"]
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
dist/
.groundcontrol/cache/
*.tsbuildinfo
```

- [ ] **Step 4: Write `packages/mcp-server/package.json`**

```json
{
  "name": "@groundcontrol/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "node esbuild.config.js",
    "dev": "node esbuild.config.js --watch",
    "test": "vitest --run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "gray-matter": "^4.0.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 5: Write `packages/mcp-server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 6: Write `packages/mcp-server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 7: Write `packages/mcp-server/esbuild.config.js`**

```javascript
import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  external: ['@modelcontextprotocol/sdk'],
});

if (watch) {
  await ctx.watch();
  console.error('Watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
```

- [ ] **Step 8: Install dependencies**

Run: `cd ~/Documents/GitHub/groundControl && npm install`
Expected: `node_modules/` created, no errors

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold groundControl monorepo with mcp-server package"
```

---

## Task 2: Types & Config Loader

**Files:**
- Create: `packages/mcp-server/src/types.ts`
- Create: `packages/mcp-server/src/config.ts`
- Test: `packages/mcp-server/tests/config.test.ts`

- [ ] **Step 1: Write the failing test for config loading**

```typescript
// tests/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  let configDir: string;
  let configPath: string;

  beforeEach(() => {
    configDir = join(tmpdir(), `gc-test-${Date.now()}`);
    mkdirSync(configDir, { recursive: true });
    configPath = join(configDir, 'config.json');
  });

  afterEach(() => {
    rmSync(configDir, { recursive: true, force: true });
  });

  it('loads a valid config file', () => {
    const config = {
      projects: [{
        name: 'test-project',
        path: '/tmp/test-project',
        features: ['issues', 'git']
      }]
    };
    writeFileSync(configPath, JSON.stringify(config));
    const result = loadConfig(configPath);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe('test-project');
    expect(result.projects[0].features).toContain('issues');
  });

  it('returns empty projects array when file is missing', () => {
    const result = loadConfig(join(configDir, 'nonexistent.json'));
    expect(result.projects).toEqual([]);
  });

  it('throws on invalid config structure', () => {
    writeFileSync(configPath, JSON.stringify({ projects: 'not-an-array' }));
    expect(() => loadConfig(configPath)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-server && npx vitest --run tests/config.test.ts`
Expected: FAIL — cannot find `../src/config.js`

- [ ] **Step 3: Write `src/types.ts`**

```typescript
export type Feature = 'issues' | 'memory' | 'git' | 'build';

export interface ProjectConfig {
  name: string;
  path: string;
  features: Feature[];
}

export interface GroundControlConfig {
  projects: ProjectConfig[];
}

export interface IssueData {
  id: string;
  category: string;
  title: string;
  type: string;
  priority: number;
  status: string;
  depends_on: string[];
  created: string;
}

export interface IssueFile {
  data: IssueData;
  content: string;
  filename: string;
  filepath: string;
}

export interface MemoryEntry {
  slug: string;
  date: string;
  filename: string;
  filepath: string;
  content: string;
}

export interface HealthReport {
  project: string;
  git: { branch: string; dirty: boolean; ahead: number; behind: number } | null;
  issues: { open: number; ready: number } | null;
  build: { fresh: boolean; staleSince: string | null } | null;
  test: { passed: boolean; timestamp: string; duration: string } | null;
}
```

- [ ] **Step 4: Write `src/config.ts`**

```typescript
import { readFileSync, existsSync } from 'fs';
import { z } from 'zod';
import type { GroundControlConfig } from './types.js';

const FeatureSchema = z.enum(['issues', 'memory', 'git', 'build']);

const ProjectSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  features: z.array(FeatureSchema),
});

const ConfigSchema = z.object({
  projects: z.array(ProjectSchema),
});

export function loadConfig(configPath: string): GroundControlConfig {
  if (!existsSync(configPath)) {
    return { projects: [] };
  }
  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  return ConfigSchema.parse(raw);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/mcp-server && npx vitest --run tests/config.test.ts`
Expected: 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: types and config loader with zod validation"
```

---

## Task 3: Utility Functions — Slugify & Frontmatter

**Files:**
- Create: `packages/mcp-server/src/utils/slugify.ts`
- Create: `packages/mcp-server/src/utils/frontmatter.ts`
- Test: `packages/mcp-server/tests/slugify.test.ts`
- Test: `packages/mcp-server/tests/frontmatter.test.ts`

- [ ] **Step 1: Write failing tests for slugify**

```typescript
// tests/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { slugify } from '../src/utils/slugify.js';

describe('slugify', () => {
  it('converts title to kebab-case', () => {
    expect(slugify('Recipe JSON Schema Definition')).toBe('recipe-json-schema-definition');
  });

  it('truncates to 40 characters at word boundary', () => {
    const long = 'This is a very long title that exceeds the forty character limit significantly';
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(40);
    expect(result).not.toEndWith('-');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify("What's the plan? (v2)")).toBe('whats-the-plan-v2');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('foo  ---  bar')).toBe('foo-bar');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest --run tests/slugify.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `src/utils/slugify.ts`**

```typescript
export function slugify(title: string, maxLength = 40): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) return slug;

  const truncated = slug.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf('-');
  return lastHyphen > 0 ? truncated.slice(0, lastHyphen) : truncated;
}
```

- [ ] **Step 4: Run slugify tests**

Run: `npx vitest --run tests/slugify.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Write failing tests for frontmatter**

```typescript
// tests/frontmatter.test.ts
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, stringifyFrontmatter } from '../src/utils/frontmatter.js';

const SAMPLE = `---
id: sch
category: scaffold
title: "Recipe JSON schema"
type: task
priority: 2
status: open
depends_on: []
created: 2026-03-21
---

Full description of the task here.`;

describe('parseFrontmatter', () => {
  it('extracts data and content', () => {
    const result = parseFrontmatter(SAMPLE);
    expect(result.data.id).toBe('sch');
    expect(result.data.priority).toBe(2);
    expect(result.content).toContain('Full description');
  });

  it('throws on missing frontmatter', () => {
    expect(() => parseFrontmatter('no frontmatter here')).toThrow();
  });
});

describe('stringifyFrontmatter', () => {
  it('round-trips without losing body content', () => {
    const parsed = parseFrontmatter(SAMPLE);
    parsed.data.priority = 1;
    const result = stringifyFrontmatter(parsed.data, parsed.content);
    expect(result).toContain('priority: 1');
    expect(result).toContain('Full description of the task here.');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest --run tests/frontmatter.test.ts`
Expected: FAIL

- [ ] **Step 7: Write `src/utils/frontmatter.ts`**

```typescript
import matter from 'gray-matter';

export interface ParsedFile {
  data: Record<string, unknown>;
  content: string;
}

export function parseFrontmatter(raw: string): ParsedFile {
  const result = matter(raw);
  if (!result.data || Object.keys(result.data).length === 0) {
    throw new Error('No frontmatter found');
  }
  return { data: result.data, content: result.content };
}

export function stringifyFrontmatter(
  data: Record<string, unknown>,
  content: string,
): string {
  return matter.stringify(content, data);
}
```

- [ ] **Step 8: Run frontmatter tests**

Run: `npx vitest --run tests/frontmatter.test.ts`
Expected: 3 tests PASS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: slugify and frontmatter utility functions"
```

---

## Task 4: Test Helpers — Temp Project Fixture

**Files:**
- Create: `packages/mcp-server/tests/helpers/test-project.ts`

- [ ] **Step 1: Write the test project helper**

```typescript
// tests/helpers/test-project.ts
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

export interface TestProject {
  path: string;
  cleanup: () => void;
  addIssue: (dir: 'open' | 'closed', filename: string, frontmatter: Record<string, unknown>, body?: string) => void;
  addMemory: (filename: string, content: string) => void;
}

export function createTestProject(name = 'test-project'): TestProject {
  const projectPath = join(tmpdir(), `gc-${name}-${Date.now()}`);
  mkdirSync(join(projectPath, '.issues', 'open'), { recursive: true });
  mkdirSync(join(projectPath, '.issues', 'closed'), { recursive: true });
  mkdirSync(join(projectPath, '.memory'), { recursive: true });
  mkdirSync(join(projectPath, 'src'), { recursive: true });
  mkdirSync(join(projectPath, 'dist'), { recursive: true });

  // Initialize git repo
  execSync('git init', { cwd: projectPath, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: projectPath, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: projectPath, stdio: 'ignore' });
  writeFileSync(join(projectPath, 'README.md'), '# Test');
  execSync('git add -A && git commit -m "init"', { cwd: projectPath, stdio: 'ignore' });

  const addIssue = (dir: 'open' | 'closed', filename: string, frontmatter: Record<string, unknown>, body = '') => {
    const matter = Object.entries(frontmatter).map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${v.join(', ')}]`;
      if (typeof v === 'string') return `${k}: "${v}"`;
      return `${k}: ${v}`;
    }).join('\n');
    writeFileSync(
      join(projectPath, '.issues', dir, filename),
      `---\n${matter}\n---\n\n${body}`,
    );
  };

  const addMemory = (filename: string, content: string) => {
    writeFileSync(join(projectPath, '.memory', filename), content);
  };

  const cleanup = () => rmSync(projectPath, { recursive: true, force: true });

  return { path: projectPath, cleanup, addIssue, addMemory };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "test: add temp project fixture helper"
```

---

## Task 5: Issue Tools

**Files:**
- Create: `packages/mcp-server/src/tools/issue-tools.ts`
- Test: `packages/mcp-server/tests/issue-tools.test.ts`

- [ ] **Step 1: Write failing tests for issue tools**

```typescript
// tests/issue-tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  closeIssue,
  reopenIssue,
  readyIssues,
} from '../src/tools/issue-tools.js';

describe('issue tools', () => {
  let project: TestProject;

  beforeEach(() => {
    project = createTestProject();
    project.addIssue('open', 'P2-scaffold-sch-recipe-schema.md', {
      id: 'sch', category: 'scaffold', title: 'Recipe schema',
      type: 'task', priority: 2, status: 'open', depends_on: [], created: '2026-03-21',
    }, 'Schema definition body.');
    project.addIssue('open', 'P1-meta-aud-audit.md', {
      id: 'aud', category: 'meta', title: 'Audit',
      type: 'task', priority: 1, status: 'open', depends_on: ['sch'], created: '2026-03-21',
    });
    project.addIssue('closed', 'P3-navigate-nav-bookmarks.md', {
      id: 'nav', category: 'navigate', title: 'Bookmarks',
      type: 'feature', priority: 3, status: 'closed', depends_on: [], created: '2026-03-20',
    });
  });

  afterEach(() => project.cleanup());

  it('listIssues returns all open issues by default', () => {
    const issues = listIssues(project.path);
    expect(issues).toHaveLength(2);
  });

  it('listIssues filters by category', () => {
    const issues = listIssues(project.path, { category: 'scaffold' });
    expect(issues).toHaveLength(1);
    expect(issues[0].data.id).toBe('sch');
  });

  it('listIssues filters by priority', () => {
    const issues = listIssues(project.path, { priority: 1 });
    expect(issues).toHaveLength(1);
    expect(issues[0].data.id).toBe('aud');
  });

  it('listIssues can include closed', () => {
    const issues = listIssues(project.path, { status: 'closed' });
    expect(issues).toHaveLength(1);
    expect(issues[0].data.id).toBe('nav');
  });

  it('getIssue returns full issue with body', () => {
    const issue = getIssue(project.path, 'sch');
    expect(issue).not.toBeNull();
    expect(issue!.content).toContain('Schema definition body.');
    expect(issue!.data.depends_on).toEqual([]);
  });

  it('getIssue returns null for nonexistent id', () => {
    expect(getIssue(project.path, 'nonexistent')).toBeNull();
  });

  it('createIssue writes a new file', () => {
    createIssue(project.path, {
      id: 'new', title: 'New feature', category: 'scaffold',
      type: 'feature', priority: 2, depends_on: ['sch'],
    }, 'Feature description.');
    const issues = listIssues(project.path);
    const found = issues.find(i => i.data.id === 'new');
    expect(found).toBeDefined();
    expect(found!.data.depends_on).toEqual(['sch']);
  });

  it('createIssue rejects duplicate id', () => {
    expect(() => createIssue(project.path, {
      id: 'sch', title: 'Duplicate', category: 'meta',
      type: 'task', priority: 2,
    }, '')).toThrow(/duplicate/i);
  });

  it('updateIssue changes priority', () => {
    updateIssue(project.path, 'sch', { priority: 0 });
    const updated = getIssue(project.path, 'sch');
    expect(updated!.data.priority).toBe(0);
    expect(updated!.content).toContain('Schema definition body.');
  });

  it('closeIssue moves file to closed/', () => {
    closeIssue(project.path, 'sch');
    expect(listIssues(project.path, { status: 'open' }).find(i => i.data.id === 'sch')).toBeUndefined();
    expect(listIssues(project.path, { status: 'closed' }).find(i => i.data.id === 'sch')).toBeDefined();
  });

  it('reopenIssue moves file back to open/', () => {
    reopenIssue(project.path, 'nav');
    expect(listIssues(project.path, { status: 'open' }).find(i => i.data.id === 'nav')).toBeDefined();
  });

  it('readyIssues returns only unblocked open issues', () => {
    const ready = readyIssues(project.path);
    expect(ready).toHaveLength(1);
    expect(ready[0].data.id).toBe('sch');
  });

  it('closeIssue updates status in frontmatter', () => {
    closeIssue(project.path, 'sch');
    const closed = getIssue(project.path, 'sch');
    expect(closed!.data.status).toBe('closed');
  });

  it('reopenIssue updates status in frontmatter', () => {
    reopenIssue(project.path, 'nav');
    const reopened = getIssue(project.path, 'nav');
    expect(reopened!.data.status).toBe('open');
  });

  it('listIssues reports malformed YAML without crashing', () => {
    writeFileSync(
      join(project.path, '.issues', 'open', 'P2-meta-bad-corrupt.md'),
      '---\n: broken: yaml: {{{\n---\nBody.',
    );
    const issues = listIssues(project.path);
    // Should return parseable issues and report the corrupt one
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it('listIssues returns empty array when .issues/ dir is missing', () => {
    const { path: barePath, cleanup: cleanBare } = createTestProject('bare');
    rmSync(join(barePath, '.issues'), { recursive: true, force: true });
    const issues = listIssues(barePath);
    expect(issues).toEqual([]);
    cleanBare();
  });

  it('updateIssue renames file when priority changes', () => {
    updateIssue(project.path, 'sch', { priority: 0 });
    const issue = getIssue(project.path, 'sch');
    expect(issue!.filepath).toContain('P0-');
    expect(issue!.filepath).not.toContain('P2-');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/issue-tools.test.ts`
Expected: FAIL — cannot find `../src/tools/issue-tools.js`

- [ ] **Step 3: Write `src/tools/issue-tools.ts`**

Implement all seven functions: `listIssues`, `getIssue`, `createIssue`, `updateIssue`, `closeIssue`, `reopenIssue`, `readyIssues`.

Key implementation details:
- `listIssues(projectPath, filters?)`: Default status filter is `'open'`. Read all `.md` files from `.issues/open/` (default) or `.issues/closed/`, parse frontmatter, apply filters. Files with malformed YAML are collected in a `warnings` array on the return value, not silently skipped. If `.issues/` directory does not exist, return empty array.
- `getIssue(projectPath, id)`: Scan both `open/` and `closed/` for a file whose frontmatter `id` matches, return full parsed file or null
- `createIssue(projectPath, data, body)`: Validate ID uniqueness by scanning both dirs, generate slug via `slugify(title)`, write file as `P{priority}-{category}-{id}-{slug}.md` using `stringifyFrontmatter`
- `updateIssue(projectPath, id, updates)`: Find file by ID, parse, merge updates into frontmatter data, write back with `stringifyFrontmatter`. If priority changes, rename the file to match the new `P{n}-` prefix.
- `closeIssue(projectPath, id)`: Find file in `open/`, rename to `closed/`, update `status` in frontmatter
- `reopenIssue(projectPath, id)`: Find file in `closed/`, rename to `open/`, update `status` in frontmatter
- `readyIssues(projectPath)`: Get all open issues, filter to those whose `depends_on` are all in `closed/`

All functions use `parseFrontmatter` and `stringifyFrontmatter` from `src/utils/frontmatter.ts` and `slugify` from `src/utils/slugify.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest --run tests/issue-tools.test.ts`
Expected: All 17 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: issue tools — list, get, create, update, close, reopen, ready"
```

---

## Task 6: Memory Tools

**Files:**
- Create: `packages/mcp-server/src/tools/memory-tools.ts`
- Test: `packages/mcp-server/tests/memory-tools.test.ts`

- [ ] **Step 1: Write failing tests for memory tools**

```typescript
// tests/memory-tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import { listMemory, searchMemory, saveMemory } from '../src/tools/memory-tools.js';

describe('memory tools', () => {
  let project: TestProject;

  beforeEach(() => {
    project = createTestProject();
    project.addMemory('2026-03-25-recipe-design.md', '# Recipe Design\n\nRecipes use JSON schema for validation.');
    project.addMemory('2026-03-25-audit-results.md', '# Audit Results\n\nTemplate audit found 3 issues.');
  });

  afterEach(() => project.cleanup());

  it('listMemory returns all entries', () => {
    const entries = listMemory(project.path);
    expect(entries).toHaveLength(2);
    expect(entries[0].slug).toBeDefined();
    expect(entries[0].date).toBeDefined();
  });

  it('searchMemory finds matching entries', () => {
    const results = searchMemory(project.path, 'recipe');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toContain('recipe');
  });

  it('searchMemory is case-insensitive', () => {
    const results = searchMemory(project.path, 'AUDIT');
    expect(results).toHaveLength(1);
  });

  it('saveMemory creates a new file with date prefix', () => {
    saveMemory(project.path, 'new-discovery', 'Found something interesting.');
    const entries = listMemory(project.path);
    expect(entries).toHaveLength(3);
    const newEntry = entries.find(e => e.slug.includes('new-discovery'));
    expect(newEntry).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/memory-tools.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `src/tools/memory-tools.ts`**

Key implementation:
- `listMemory(projectPath)`: Read `.memory/` dir, parse filenames (`YYYY-MM-DD-slug.md`), return entries with date, slug, filepath, and content
- `searchMemory(projectPath, query)`: Call `listMemory`, filter by case-insensitive match against filename and content
- `saveMemory(projectPath, slug, body)`: Write `YYYY-MM-DD-{slug}.md` to `.memory/` with today's date

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest --run tests/memory-tools.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: memory tools — list, search, save"
```

---

## Task 7: Git & Build Health Utilities

**Files:**
- Create: `packages/mcp-server/src/utils/git.ts`
- Create: `packages/mcp-server/src/utils/build-health.ts`
- Create: `packages/mcp-server/src/tools/git-tools.ts`
- Test: `packages/mcp-server/tests/git-tools.test.ts`
- Test: `packages/mcp-server/tests/build-health.test.ts`

- [ ] **Step 1: Write failing tests for git-summary**

```typescript
// tests/git-tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import { gitSummary } from '../src/tools/git-tools.js';

describe('gitSummary', () => {
  let project: TestProject;

  beforeEach(() => {
    project = createTestProject();
  });

  afterEach(() => project.cleanup());

  it('returns branch name and clean state', () => {
    const result = gitSummary(project.path);
    expect(result.branch).toBeDefined();
    expect(result.dirty).toBe(false);
    expect(result.commits).toHaveLength(1);
  });

  it('detects dirty state', () => {
    writeFileSync(join(project.path, 'dirty.txt'), 'uncommitted');
    const result = gitSummary(project.path);
    expect(result.dirty).toBe(true);
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(project.path, `file${i}.txt`), `content ${i}`);
      execSync(`git add -A && git commit -m "commit ${i}"`, { cwd: project.path, stdio: 'ignore' });
    }
    const result = gitSummary(project.path, 3);
    expect(result.commits).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Write failing tests for build-health**

```typescript
// tests/build-health.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, utimesSync } from 'fs';
import { join } from 'path';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import { checkBuildFreshness, readTestStatus } from '../src/utils/build-health.js';

describe('build health', () => {
  let project: TestProject;

  beforeEach(() => {
    project = createTestProject();
  });

  afterEach(() => project.cleanup());

  it('reports fresh when dist is newer than src', () => {
    writeFileSync(join(project.path, 'src', 'code.ts'), 'old');
    const past = new Date(Date.now() - 60000);
    utimesSync(join(project.path, 'src', 'code.ts'), past, past);
    writeFileSync(join(project.path, 'dist', 'code.js'), 'built');
    const result = checkBuildFreshness(project.path);
    expect(result.fresh).toBe(true);
  });

  it('reports stale when src is newer than dist', () => {
    writeFileSync(join(project.path, 'dist', 'code.js'), 'old build');
    const past = new Date(Date.now() - 60000);
    utimesSync(join(project.path, 'dist', 'code.js'), past, past);
    writeFileSync(join(project.path, 'src', 'code.ts'), 'new code');
    const result = checkBuildFreshness(project.path);
    expect(result.fresh).toBe(false);
  });

  it('returns null when dist is missing', () => {
    expect(checkBuildFreshness(join(project.path, 'nonexistent'))).toBeNull();
  });

  it('reads test status from cache file', () => {
    const cacheDir = join(project.path, '.groundcontrol', 'cache');
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(join(cacheDir, 'test-result.json'), JSON.stringify({
      passed: true, timestamp: '2026-03-28T12:00:00Z', duration: '3.2s'
    }));
    const result = readTestStatus(project.path);
    expect(result!.passed).toBe(true);
  });

  it('returns null when no test cache exists', () => {
    expect(readTestStatus(project.path)).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest --run tests/git-tools.test.ts tests/build-health.test.ts`
Expected: FAIL

- [ ] **Step 4: Write `src/utils/git.ts`**

Key implementation: use `execSync` to run `git branch --show-current`, `git status --porcelain`, `git log --oneline -n {limit}`, `git rev-list --left-right --count HEAD...@{upstream}`. Parse output into structured objects. Wrap all in try/catch for non-git directories.

- [ ] **Step 5: Write `src/utils/build-health.ts`**

Key implementation:
- `checkBuildFreshness(projectPath)`: Walk `src/` for newest mtime, compare to `dist/` directory mtime. Return `{ fresh, staleSince }` or null.
- `readTestStatus(projectPath)`: Read `.groundcontrol/cache/test-result.json`, parse, return or null.

- [ ] **Step 6: Write `src/tools/git-tools.ts`**

```typescript
import { getGitState } from '../utils/git.js';

export function gitSummary(projectPath: string, limit = 10) {
  return getGitState(projectPath, limit);
}
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest --run tests/git-tools.test.ts tests/build-health.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: git summary and build health utilities"
```

---

## Task 8: Project Tools

**Files:**
- Create: `packages/mcp-server/src/tools/project-tools.ts`
- Test: `packages/mcp-server/tests/project-tools.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/project-tools.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import { projectHealth, listProjects } from '../src/tools/project-tools.js';
import type { ProjectConfig } from '../src/types.js';

describe('projectHealth', () => {
  let project: TestProject;
  let config: ProjectConfig;

  beforeEach(() => {
    project = createTestProject();
    config = { name: 'test', path: project.path, features: ['issues', 'memory', 'git', 'build'] };
    project.addIssue('open', 'P2-meta-tst-test.md', {
      id: 'tst', category: 'meta', title: 'Test issue',
      type: 'task', priority: 2, status: 'open', depends_on: [], created: '2026-03-28',
    });
  });

  afterEach(() => project.cleanup());

  it('returns health report with all features', () => {
    const health = projectHealth(config);
    expect(health.project).toBe('test');
    expect(health.issues).not.toBeNull();
    expect(health.issues!.open).toBe(1);
    expect(health.git).not.toBeNull();
    expect(health.git!.dirty).toBe(false);
  });

  it('omits sections for disabled features', () => {
    config.features = ['git'];
    const health = projectHealth(config);
    expect(health.issues).toBeNull();
    expect(health.build).toBeNull();
    expect(health.git).not.toBeNull();
  });
});

describe('listProjects', () => {
  let project: TestProject;

  beforeEach(() => {
    project = createTestProject();
  });

  afterEach(() => project.cleanup());

  it('returns health for all registered projects', () => {
    const configs: ProjectConfig[] = [
      { name: 'test', path: project.path, features: ['issues', 'git'] },
    ];
    const result = listProjects(configs);
    expect(result).toHaveLength(1);
    expect(result[0].project).toBe('test');
  });

  it('warns about missing project directories', () => {
    const configs: ProjectConfig[] = [
      { name: 'ghost', path: '/nonexistent/path', features: ['git'] },
    ];
    const result = listProjects(configs);
    expect(result).toHaveLength(1);
    expect(result[0].git).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest --run tests/project-tools.test.ts`
Expected: FAIL

- [ ] **Step 3: Write `src/tools/project-tools.ts`**

Key implementation:
- `projectHealth(config)`: Check each feature flag, call the corresponding utility (issue count, git state, build freshness, test status), assemble `HealthReport`
- `listProjects(configs)`: Map over all project configs, call `projectHealth` for each, return array

- [ ] **Step 4: Run tests**

Run: `npx vitest --run tests/project-tools.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: project health and list-projects tools"
```

---

## Task 9: MCP Server Entry Point — Register Tools & Resources

**Files:**
- Create: `packages/mcp-server/src/resources/project-resources.ts`
- Create: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Write `src/resources/project-resources.ts`**

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ProjectConfig } from '../types.js';

export function readProjectFile(config: ProjectConfig, filename: string): string | null {
  const filepath = join(config.path, filename);
  if (!existsSync(filepath)) return null;
  return readFileSync(filepath, 'utf-8');
}
```

- [ ] **Step 2: Write `src/index.ts`**

This is the server entry point. It:
1. Imports `McpServer` and `StdioServerTransport` from `@modelcontextprotocol/sdk`
2. Loads config from `~/.groundcontrol/config.json` via `loadConfig`
3. Creates server instance: `new McpServer({ name: 'groundControl', version: '0.1.0' })`
4. Registers all tools with `server.registerTool(name, { description, inputSchema }, handler)`:
   - Each tool uses `zod` schemas for `inputSchema`
   - Each handler resolves the `project` param against the config, checks feature flags, calls the appropriate function from `tools/`
   - Returns `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`
5. Registers resources with `server.registerResource(name, uri, metadata, handler)`:
   - `project://{name}/roadmap` → reads `ROADMAP.md`
   - `project://{name}/claude-md` → reads `CLAUDE.md`
6. Connects via stdio: `await server.connect(new StdioServerTransport())`

Full tool registrations (13 tools):
- `list-projects` — no params
- `project-health` — `{ project: z.string() }`
- `list-issues` — `{ project: z.string(), status: z.enum(['open','closed']).optional(), category: z.string().optional(), priority: z.number().optional() }`
- `get-issue` — `{ project: z.string(), id: z.string() }`
- `create-issue` — `{ project: z.string(), id: z.string(), title: z.string(), category: z.string(), type: z.string(), priority: z.number(), depends_on: z.array(z.string()).optional(), body: z.string() }`
- `update-issue` — `{ project: z.string(), id: z.string(), priority: z.number().optional(), depends_on: z.array(z.string()).optional(), title: z.string().optional() }`
- `close-issue` — `{ project: z.string(), id: z.string() }`
- `reopen-issue` — `{ project: z.string(), id: z.string() }`
- `ready-issues` — `{ project: z.string() }`
- `list-memory` — `{ project: z.string() }`
- `search-memory` — `{ project: z.string(), query: z.string() }`
- `save-memory` — `{ project: z.string(), slug: z.string(), body: z.string() }`
- `git-summary` — `{ project: z.string(), limit: z.number().optional() }`

Resource registrations (dynamic, one per project):
- For each project in config, register `project://{name}/roadmap` and `project://{name}/claude-md`

Each tool handler should use a shared `resolveProject(configs, name, requiredFeature)` helper that: (1) finds the project config by name, (2) checks the feature flag, (3) returns the config or throws a clear error. This avoids duplicating validation logic across 13 handlers.

- [ ] **Step 3: Write resource tests**

```typescript
// tests/project-resources.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createTestProject, type TestProject } from './helpers/test-project.js';
import { readProjectFile } from '../src/resources/project-resources.js';
import type { ProjectConfig } from '../src/types.js';

describe('project resources', () => {
  let project: TestProject;
  let config: ProjectConfig;

  beforeEach(() => {
    project = createTestProject();
    config = { name: 'test', path: project.path, features: ['issues'] };
    writeFileSync(join(project.path, 'ROADMAP.md'), '# Roadmap\n\nPhase 1...');
    writeFileSync(join(project.path, 'CLAUDE.md'), '# CLAUDE.md\n\nInstructions...');
  });

  afterEach(() => project.cleanup());

  it('reads ROADMAP.md', () => {
    const content = readProjectFile(config, 'ROADMAP.md');
    expect(content).toContain('Phase 1');
  });

  it('reads CLAUDE.md', () => {
    const content = readProjectFile(config, 'CLAUDE.md');
    expect(content).toContain('Instructions');
  });

  it('returns null when file does not exist', () => {
    expect(readProjectFile(config, 'NONEXISTENT.md')).toBeNull();
  });

  it('returns null for nonexistent project path', () => {
    config.path = '/nonexistent/path';
    expect(readProjectFile(config, 'ROADMAP.md')).toBeNull();
  });
});
```

- [ ] **Step 4: Write feature flag integration tests**

```typescript
// tests/server-integration.test.ts
import { describe, it, expect } from 'vitest';
import type { ProjectConfig } from '../src/types.js';
import { listIssues } from '../src/tools/issue-tools.js';
import { listMemory } from '../src/tools/memory-tools.js';
import { createTestProject } from './helpers/test-project.js';

// These tests verify that the resolveProject helper correctly gates
// tool access by feature flags. The actual gating is in index.ts handlers,
// but we can test the pattern here.

describe('feature flag gating', () => {
  it('issue tools return empty for project without .issues/', () => {
    const project = createTestProject('no-issues');
    const { rmSync } = require('fs');
    const { join } = require('path');
    rmSync(join(project.path, '.issues'), { recursive: true, force: true });
    const issues = listIssues(project.path);
    expect(issues).toEqual([]);
    project.cleanup();
  });

  it('memory tools return empty for project without .memory/', () => {
    const project = createTestProject('no-memory');
    const { rmSync } = require('fs');
    const { join } = require('path');
    rmSync(join(project.path, '.memory'), { recursive: true, force: true });
    const entries = listMemory(project.path);
    expect(entries).toEqual([]);
    project.cleanup();
  });
});
```

- [ ] **Step 5: Run resource and integration tests**

Run: `npx vitest --run tests/project-resources.test.ts tests/server-integration.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Build**

Run: `cd packages/mcp-server && npm run build`
Expected: `dist/index.js` created with no errors

- [ ] **Step 7: Type-check**

Run: `npm run type-check`
Expected: No type errors

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: MCP server entry point — all tools and resources registered"
```

---

## Task 10: Write CLAUDE.md & Config, End-to-End Verification

**Files:**
- Create: `groundControl/CLAUDE.md`
- Create: `~/.groundcontrol/config.json` (if it doesn't exist)
- Modify: `~/.claude/settings.json` (add MCP server entry)

- [ ] **Step 1: Write `CLAUDE.md`**

Document commands (`npm run build`, `npm test`, `npm run dev`), architecture overview, file structure, and conventions for the groundControl repo.

- [ ] **Step 2: Create `~/.groundcontrol/config.json` with stratusHue**

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

- [ ] **Step 3: Add groundControl to `~/.claude/settings.json`**

Add to the `mcpServers` section:
```json
"groundControl": {
  "command": "node",
  "args": ["/Users/levinsadsad/Documents/GitHub/groundControl/packages/mcp-server/dist/index.js"]
}
```

- [ ] **Step 4: Build the server**

Run: `cd ~/Documents/GitHub/groundControl/packages/mcp-server && npm run build`
Expected: `dist/index.js` created

- [ ] **Step 5: End-to-end smoke test**

Start a new Claude Code session and verify:
- groundControl appears in `/mcp`
- Ask Claude to run `list-projects` — should show stratusHue
- Ask Claude to run `list-issues` for stratusHue — should return the open issues
- Ask Claude to run `ready-issues` for stratusHue — should return unblocked issues
- Ask Claude to run `git-summary` for stratusHue — should show current branch and recent commits

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: CLAUDE.md and end-to-end verification notes"
```

- [ ] **Step 7: Push to remote**

Create the GitHub repo and push:
```bash
gh repo create groundControl --private --source=. --push
```
