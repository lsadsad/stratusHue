#!/usr/bin/env python3
"""Export all beads issues to a readable markdown file.
Usage: bd list --json | python3 scripts/export-beads.py > docs/BEADS-EXPORT.md
"""
import json, sys
from datetime import datetime

issues = json.load(sys.stdin)
today = datetime.utcnow().strftime('%Y-%m-%d')

priority_labels = {0: 'P0 Critical', 1: 'P1 High', 2: 'P2 Medium', 3: 'P3 Low', 4: 'P4 Backlog'}
status_order = ['open', 'in_progress', 'closed']
status_labels = {'open': 'Open', 'in_progress': 'In Progress', 'closed': 'Closed'}

lines = [
    f'# stratusHue — Beads Issue Export',
    f'',
    f'Exported: {today}  |  Total: {len(issues)} issues',
    f'',
    f'> Re-import guide: on the target machine, run `bd init` then use `bd create` ',
    f'> for each open issue below (copy id, title, description, priority, type).',
    f'',
]

for status in status_order:
    group = [i for i in issues if i.get('status') == status]
    if not group:
        continue
    lines.append(f'## {status_labels[status]} ({len(group)})')
    lines.append('')
    for i in group:
        p = i.get('priority', 2)
        pstr = priority_labels.get(p, f'P{p}')
        itype = i.get('issue_type', 'task')
        lines.append(f'### `{i["id"]}` — {i["title"]}')
        lines.append(f'**Type:** {itype}  |  **Priority:** {pstr}  |  **Owner:** {i.get("owner", "—")}')
        lines.append(f'**Created:** {i.get("created_at", "")[:10]}  |  **Updated:** {i.get("updated_at", "")[:10]}')
        if i.get('closed_at'):
            lines.append(f'**Closed:** {i["closed_at"][:10]}')
        if i.get('close_reason'):
            lines.append(f'**Close reason:** {i["close_reason"]}')
        desc = i.get('description', '').replace('\\n', '\n').strip()
        if desc:
            lines.append('')
            for dline in desc.split('\n'):
                lines.append(dline)
        deps = i.get('dependencies', [])
        if deps:
            lines.append('')
            lines.append('**Dependencies:**')
            for d in deps:
                lines.append(f'- `{d["depends_on_id"]}` ({d["type"]})')
        lines.append('')
        lines.append('---')
        lines.append('')

print('\n'.join(lines))
