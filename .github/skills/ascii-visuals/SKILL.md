---
name: ascii-visuals
description: "Fast ASCII/emoji diagrams to explain code concepts, architectures, data structures, algorithms, and flows. Use when: explaining how something works; visualizing a system, component, or data flow; comparing before/after states; illustrating tree/graph structures; making an architecture diagram; drawing a flowchart or state machine; showing call stacks, memory layouts, or sequence of events. Outputs quick, labeled diagrams in code blocks. Prioritizes speed over polish."
argument-hint: "Describe the concept, structure, or system to visualize"
---

# ASCII Visuals

Fast, emoji-rich diagrams that make concepts click. Output a fenced code block, a 1-sentence caption, done. Don't overthink it.

## Speed Rules

1. **Diagram first, talk second** — open the code block immediately, explain after
2. **No preamble** — skip "here's a diagram showing…" — just draw it
3. **One diagram per concept** — if the user asked one question, one diagram
4. **Skip variations** — don't offer alternatives unless asked
5. **Emoji > box-drawing when possible** — they're faster to read and faster to produce

## Emoji Vocabulary

Use emojis as **node labels and status indicators** to reduce text and add instant meaning:

| Category | Emojis | Use for |
|----------|--------|---------|
| Components | 🖥️ 📱 🌐 🗄️ ☁️ 🔌 | client, mobile, web, database, cloud, API |
| Data flow | ➡️ ⬅️ ⬆️ ⬇️ 🔄 ↩️ | direction, sync, return |
| Status | ✅ ❌ ⚠️ 🔒 🔓 ⏳ 💤 | pass, fail, warn, locked, unlocked, pending, idle |
| Logic | 🔀 🔁 ❓ 🛑 🚦 | branch, loop, decision, stop, gate |
| Layers | 🎨 ⚙️ 💾 🧪 📦 🔧 | UI, engine, storage, test, package, config |
| Events | 📩 📤 🔔 👁️ ⚡ 🕐 | receive, send, notify, observe, trigger, timer |
| People | 👤 👥 🤖 🧑‍💻 | user, users, bot/service, developer |

### Emoji in diagrams — two styles

**Inline labels** (inside boxes or on arrows):
```
┌─────────┐  📩 req   ┌─────────┐  💾 query  ┌──────┐
│ 🌐 Web  │──────────▶│ ⚙️ API  │──────────▶│ 🗄️ DB │
└─────────┘  ⬅️ res   └─────────┘  ⬅️ rows  └──────┘
```

**Pure emoji shorthand** (ultra-fast, no boxes):
```
👤 ➡️ 🌐 ➡️ ⚙️ ➡️ 🗄️
         ⬇️
👤 ⬅️ 🌐 ⬅️ ⚙️ ⬅️ 🗄️
```

Use pure-emoji for quick sketches in chat. Use inline-labels when the diagram will be saved or shared.

## Procedure

### 1. Pick the diagram type
Glance at [diagram types](./references/diagram-types.md) if unsure. Common picks:
- **Sequence** → use the [renderer script](./scripts/ascii-sequence.js) (pipe JSON, get pixel-perfect output)
- **Architecture/layers** → stack with `╔═╗` or emoji nodes
- **Tree/graph** → indent with `/` `\` or `├──`
- **Flowchart** → top-down boxes with `▼` arrows
- **Before/after** → side-by-side with `──▶` between

### 2. Draw it
- Default to **Unicode + emoji**. Fall back to pure ASCII only for code comments.
- Keep width ≤ 72 chars.
- Label everything — nodes, edges, layers.
- For sequence diagrams, **always use the script** — don't hand-draw:
```bash
cat <<'EOF' | node ~/.copilot/skills/ascii-visuals/scripts/ascii-sequence.js
{
  "participants": ["Browser", "CDN", "Server"],
  "messages": [
    { "from": "Browser", "to": "CDN", "label": "GET /page" },
    { "from": "CDN", "to": "Server", "label": "fwd" },
    { "from": "Server", "to": "Browser", "label": "200 OK" }
  ]
}
EOF
```

### 3. Caption
One sentence after the code block: what it shows.

## Quick Templates

**Box flow:**
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 🎨 UI    │────▶│ ⚙️ Logic │────▶│ 💾 Store │
└──────────┘     └──────────┘     └──────────┘
```

**Layer stack:**
```
╔═══════════════════╗
║  🎨 Presentation  ║
╠═══════════════════╣
║  ⚙️  Business     ║
╠═══════════════════╣
║  💾 Data          ║
╚═══════════════════╝
```

**Decision:**
```
        ❓ auth?
       ╱       ╲
    ✅ yes    ❌ no
      │          │
  📦 data    🛑 403
```

**Tree:**
```
        📦 root
       ╱       ╲
   📁 src     📁 test
   ╱    ╲        │
 📄 a   📄 b   📄 c
```

**Status board:**
```
  ✅ Login      ⚠️ Payments    ❌ Search
  ✅ Profile    ✅ Checkout     ⏳ Filters
```

See [diagram types](./references/diagram-types.md), [examples](./references/examples.md), [palette](./references/palette.md), [precision](./references/precision.md) for deep reference when needed.
