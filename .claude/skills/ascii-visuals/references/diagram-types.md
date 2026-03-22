# Diagram Type Blueprints

Each section gives: trigger phrases → canonical blueprint → construction notes.

---

## 1. Architecture / Layered System

**Triggers**: architecture, layers, system overview, tech stack, MVC, clean architecture

```
╔══════════════════════════════════╗
║           UI / Client            ║
╠══════════════════════════════════╣
║         API Gateway              ║
╠══════════════════════════════════╣
║    Service A  │  Service B       ║
╠══════════════════════════════════╣
║         Database Layer           ║
╚══════════════════════════════════╝
```

**Notes**: Use `╠═╣` dividers between layers. Put cross-cutting concerns (auth, logging) in a side column connected with `◀──▶`.

---

## 2. Component / Dependency Graph

**Triggers**: depends on, imports, calls, component map, module relationships

```
┌────────┐     ┌────────┐     ┌────────┐
│  Main  │────▶│ Router │────▶│Handler │
└────────┘     └────────┘     └───┬────┘
                                  │
                          ┌───────▼───────┐
                          │   Database    │
                          └───────────────┘
```

**Notes**: Arrow direction = dependency direction. Bidirectional = `◀──▶`. Dashed `- - ▶` for optional/async.

---

## 3. Flowchart / Decision Tree

**Triggers**: flowchart, decision, if/else, control flow, algorithm steps, process

```
        ┌─────────────┐
        │    Start    │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Condition? │
        └──┬───────┬──┘
          YES      NO
           │        │
    ┌──────▼──┐  ┌──▼──────┐
    │ Action A│  │ Action B│
    └──────┬──┘  └──┬──────┘
           └────┬───┘
         ┌──────▼──────┐
         │     End     │
         └─────────────┘
```

**Notes**: Diamonds for decisions can be simulated with angled text:
```
  ◆ condition? ◆
  yes ↙   ↘ no
```

---

## 4. Sequence / Message Passing

**Triggers**: sequence, message flow, timeline, request/response, events, postMessage, IPC

```
  Client          Server          Database
    │                │                │
    │── request ────▶│                │
    │                │── query ──────▶│
    │                │                │
    │                │◀── result ─────│
    │◀── response ───│                │
    │                │                │
```

**Notes**: Vertical lines are lifelines. Time flows downward. Async messages: `- - ▶`. Return arrows: `◀─ ─`. Add boxes over lifelines for activations.

---

## 5. Binary Tree / BST

**Triggers**: tree, BST, heap, trie, recursion tree, parse tree, AST

```
           [8]
          /   \
        [3]   [10]
        / \      \
      [1] [6]   [14]
          / \   /
        [4] [7][13]
```

**Notes**: For wide trees compress parent lines. For very deep trees prefer a list-style: `8 → 3 (L), 10 (R)`.

---

## 6. Linked List / Chain

**Triggers**: linked list, chain, next pointer, doubly linked, queue internal

```
┌────┬──┐   ┌────┬──┐   ┌────┬──┐
│ 1  │ ─┼──▶│ 2  │ ─┼──▶│ 3  │∅ │
└────┴──┘   └────┴──┘   └────┴──┘
  head
```

Doubly linked:
```
      ┌──────────┐     ┌──────────┐
NULL ◀┤ prev│ 1 │◀────▶│ 2 │next ├▶ NULL
      └──────────┘     └──────────┘
```

---

## 7. State Machine

**Triggers**: state machine, FSM, states, transitions, lifecycle, status

```
         ┌─────────┐
    ┌───▶│  IDLE   │◀────────────┐
    │    └────┬────┘             │
    │       start                │
    │    ┌────▼────┐          cancel
    │    │LOADING  │             │
    │    └────┬────┘             │
    │       done        ┌────────┴────────┐
    │    ┌────▼────┐    │                 │
    │    │ SUCCESS │    │     ERROR       │
    │    └────┬────┘    └─────────────────┘
    │       reset
    └────────┘
```

**Notes**: Label every transition arrow. Group states into regions with `[ ]` for super-states.

---

## 8. File / Folder Tree

**Triggers**: file structure, directory, project layout, folder tree

```
project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── tests/
│   └── button.test.tsx
└── package.json
```

**Notes**: `├──` for non-last siblings, `└──` for last child, `│` for vertical continuation, `    ` (4 spaces) for indent after `└──`.

---

## 9. Stack / Call Stack

**Triggers**: call stack, execution stack, stack frame, function calls, recursion

```
  ┌─────────────────────────┐  ← top (most recent)
  │  factorial(1)           │
  ├─────────────────────────┤
  │  factorial(2)           │
  ├─────────────────────────┤
  │  factorial(3)           │
  ├─────────────────────────┤
  │  main()                 │
  └─────────────────────────┘  ← bottom
```

Growth direction arrow on the side: `↑ grows up` or `↓ grows down`.

---

## 10. Memory / Byte Layout

**Triggers**: memory layout, struct, buffer, byte offset, bitfield, packet format

```
 Offset  0    1    2    3
        ┌────┬────┬────┬────┐
 0x00   │ op │ fl │    len  │
        ├────┴────┴────┴────┤
 0x04   │     payload...    │
        └───────────────────┘
```

**Notes**: Show offsets on the left, bit-ranges on top for bit-field layouts. Group multi-byte fields with `╔═╝` spanning.

---

## 11. Timeline / Gantt-style

**Triggers**: timeline, gantt, phases, milestones, concurrent, parallel tasks

```
         Jan   Feb   Mar   Apr   May
Phase 1  ████████
Phase 2        ██████████
Phase 3               ████████████
         │─────│─────│─────│─────│
```

**Notes**: `█` for active, `░` for blocked/waiting, `◆` for milestones.

---

## 12. Before / After Transformation

**Triggers**: before, after, refactor, transformation, diff, mutation

```
  BEFORE                     AFTER

┌──────────────┐         ┌──────────────┐
│  Monolith    │   ──▶   │  Service A   │
│              │         └──────────────┘
│  (all code)  │         ┌──────────────┐
│              │         │  Service B   │
└──────────────┘         └──────────────┘
```

Side-by-side with a central `──▶` arrow. Label the transformation (e.g., "extract", "split", "invert").

---

## 13. Database / ERD

**Triggers**: database, schema, entity, relation, foreign key, join, tables

```
┌───────────────┐         ┌───────────────┐
│    users      │         │    orders     │
├───────────────┤         ├───────────────┤
│ PK  id        │◀──────┐ │ PK  id        │
│     name      │       └─│ FK  user_id   │
│     email     │         │     total     │
└───────────────┘         └───────────────┘
         1                       N
```

Cardinality notation: `1──<` for one-to-many, `>──<` for many-to-many, `1──1` for one-to-one.

---

## 14. Network / Infrastructure

**Triggers**: network, load balancer, CDN, cloud, infrastructure, topology, nodes

```
            ┌──────────┐
   users ──▶│  CDN/LB  │
            └────┬─────┘
         ┌───────┼───────┐
    ┌────▼──┐ ┌──▼───┐ ┌─▼────┐
    │ Web-1 │ │Web-2 │ │Web-3 │
    └────┬──┘ └──┬───┘ └─┬────┘
         └───────┼───────┘
            ┌────▼─────┐
            │  DB/Cache │
            └──────────┘
```

---

## 15. Comparison Table (ASCII)

**Triggers**: compare, tradeoffs, pros/cons, vs, differences

```
┌────────────┬──────────────┬──────────────┐
│ Feature    │  Option A    │  Option B    │
├────────────┼──────────────┼──────────────┤
│ Speed      │    Fast      │   Slower     │
│ Memory     │    High      │    Low       │
│ Complexity │   Simple     │  Complex     │
└────────────┴──────────────┴──────────────┘
```
