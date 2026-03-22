#!/usr/bin/env python3
"""Export beads issues to markdown + optional SQL dump.

Usage:
  bd list --json | python3 scripts/export-beads.py          # markdown to stdout
  python3 scripts/export-beads.py --full                    # SQL dump + markdown to files
  # Re-import: cd .beads/dolt/stratusHue && dolt sql < ../../../docs/stratusHue-beads-<date>.sql
"""
import json, sys, os, subprocess, shutil
from datetime import datetime

PRIORITY = {0: 'P0 Critical', 1: 'P1 High', 2: 'P2 Medium', 3: 'P3 Low', 4: 'P4 Backlog'}
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def build_markdown(issues):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    lines = [
        '# stratusHue — Beads Issue Export', '',
        f'Exported: {today}  |  Total: {len(issues)} issues', '',
        '> Re-import: `bd init` then recreate open issues with `bd create`.',
        '> Full DB restore: `cd .beads/dolt/stratusHue && dolt sql < ../../../docs/stratusHue-beads-<date>.sql`',
        '',
    ]
    for status in ['open', 'in_progress', 'closed']:
        group = [i for i in issues if i.get('status') == status]
        if not group:
            continue
        label = {'open': 'Open', 'in_progress': 'In Progress', 'closed': 'Closed'}[status]
        lines += [f'## {label} ({len(group)})', '']
        for i in group:
            p = PRIORITY.get(i.get('priority', 2), 'P2 Medium')
            lines.append(f'### `{i["id"]}` — {i["title"]}')
            lines.append(f'**Type:** {i.get("issue_type","task")}  |  **Priority:** {p}  |  **Owner:** {i.get("owner","—")}')
            lines.append(f'**Created:** {i.get("created_at","")[:10]}  |  **Updated:** {i.get("updated_at","")[:10]}')
            if i.get('closed_at'):
                lines.append(f'**Closed:** {i["closed_at"][:10]}')
            if i.get('close_reason'):
                lines.append(f'**Close reason:** {i["close_reason"]}')
            desc = i.get('description', '').replace('\\n', '\n').strip()
            if desc:
                lines += [''] + desc.split('\n')
            deps = i.get('dependencies', [])
            if deps:
                lines += ['', '**Dependencies:**'] + [f'- `{d["depends_on_id"]}` ({d["type"]})' for d in deps]
            lines += ['', '---', '']
    return '\n'.join(lines)


def sql_dump():
    today = datetime.utcnow().strftime('%Y-%m-%d')
    db_dir = os.path.join(REPO_ROOT, '.beads', 'dolt', 'stratusHue')
    docs_dir = os.path.join(REPO_ROOT, 'docs')
    dolt = shutil.which('dolt')
    if not dolt:
        print('ERROR: dolt binary not found', file=sys.stderr)
        return None
    subprocess.run([dolt, 'dump', '-f', '-r', 'sql', '--no-create-db'],
                   cwd=db_dir, check=True, capture_output=True)
    dest = os.path.join(docs_dir, f'stratusHue-beads-{today}.sql')
    shutil.copy2(os.path.join(db_dir, 'doltdump.sql'), dest)
    return dest


if __name__ == '__main__':
    if '--full' in sys.argv:
        # SQL dump
        sql_path = sql_dump()
        if sql_path:
            print(f'SQL dump:  {sql_path}')
        # Markdown
        result = subprocess.run(['bd', 'list', '--json'], capture_output=True, text=True, cwd=REPO_ROOT)
        issues = json.loads(result.stdout)
        md_path = os.path.join(REPO_ROOT, 'docs', 'BEADS-EXPORT.md')
        with open(md_path, 'w') as f:
            f.write(build_markdown(issues))
        print(f'MD export: {md_path}')
        today = datetime.utcnow().strftime('%Y-%m-%d')
        print(f'\nCommit with:')
        print(f'  git add docs/BEADS-EXPORT.md "docs/stratusHue-beads-{today}.sql" && git commit -m "chore: beads backup {today}" && git push')
    else:
        issues = json.load(sys.stdin)
        print(build_markdown(issues))
