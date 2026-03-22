# Worked Examples

Complete, real-world ASCII visuals for reference and adaptation.

---

## Example 1 — Figma Plugin Message-Passing Architecture

```
╔══════════════════════════════════════════════════════╗
║                  Figma Plugin Runtime                ║
╠════════════════════════╦═════════════════════════════╣
║      Sandbox           ║        UI iframe            ║
║   (code.ts runs here)  ║   (ui.ts runs here)         ║
║                        ║                             ║
║  figma.* API ✓         ║  DOM / localStorage ✓       ║
║  DOM         ✗         ║  figma.*            ✗       ║
║                        ║                             ║
║  ┌──────────────────┐  ║  ┌──────────────────────┐  ║
║  │  figma.ui        │  ║  │  window.onmessage    │  ║
║  │  .postMessage()  │──╬─▶│  { pluginMessage }   │  ║
║  └──────────────────┘  ║  └──────────────────────┘  ║
║                        ║                             ║
║  ┌──────────────────┐  ║  ┌──────────────────────┐  ║
║  │ figma.ui.onmessage◀─╬──│  sendMessage()        │  ║
║  │  validateMessage │  ║  │  (send-message.ts)   │  ║
║  └──────────────────┘  ║  └──────────────────────┘  ║
╚════════════════════════╩═════════════════════════════╝
```

**What it shows**: The two isolated runtimes of a Figma plugin — the sandbox (access to `figma.*`) and the UI iframe (access to DOM) — and how they communicate exclusively via postMessage. Neither side can reach the other's APIs directly.

---

## Example 2 — React Component Tree

```
                    <App>
                   /     \
          <Header>         <Main>
              |           /     \
          <NavBar>   <Sidebar>  <Content>
                         |          |
                    <FilterList> <PostList>
                                    |
                               <PostCard> × N
```

**What it shows**: The component hierarchy and which components own which children. `× N` marks a repeated element rendered from a list.

---

## Example 3 — HTTP Request / Response Lifecycle

Column plan: Browser=col 8 · CDN=col 26 · Origin Server=col 46 · Database=col 63

```
  Browser           CDN         Origin Server     Database
     │               ┊               ┊               ┊
     │── GET /page ─▶│               ┊               ┊
     │               │               ┊               ┊
     │         ╔═════╧═════╗         ┊               ┊
     │         ║ cache HIT?║         ┊               ┊
     │         ╚═╤═══════╤═╝         ┊               ┊
     │         yes│       │no        ┊               ┊
     │◀─ 200 ─────┘       │          ┊               ┊
     │               ┊    │── fwd ───▶               ┊
     │               ┊    ┊          │── SELECT ─────▶
     │               ┊    ┊          │◀─── rows ───────
     │               ┊    ┊          │               │
     │◀──────────────────│◀─ 200 (+cache) ─│         │
     │               ┊    ┊          ┊               ┊
```

Key rules applied:
- `(+cache)` is **inline** on the 200 arrow — not a second line (avoids lifeline gap)
- Every `│`/`┊` character appears on **every row**, including the label-only rows
- Decision box uses `╧`/`╤` to thread the CDN lifeline through the box

**What it shows**: CDN cache hit short-circuits back to browser; miss forwards to origin → DB query → 200 with cache stored inline on the return arrow.

---

## Example 4 — Binary Search Algorithm Steps

```
  Array: [ 1  3  5  7  9  11  13  15 ]
  Target: 7

  Step 1:  lo=0  hi=7  mid=3  ──▶  arr[3]=7  ✓ FOUND

  Trace:
  ┌──┬──┬──┬──┬──┬──┬──┬──┐
  │1 │3 │5 │7 │9 │11│13│15│
  └──┴──┴──┴──┴──┴──┴──┴──┘
   0  1  2 [3] 4  5  6  7
             ↑
            mid (=target, done in 1 step)

  Worst case divergence on target=14:
  ┌──┬──┬──┬──┬──┬──┬──┬──┐
  │1 │3 │5 │7 │9 │11│13│15│  lo=0  hi=7  mid=3  arr[3]=7 < 14 → search right
  └──┴──┴──┴──┴──┴──┴──┴──┘
               └──────────┘   lo=4  hi=7  mid=5  arr[5]=11 < 14 → search right
                     └────┘   lo=6  hi=7  mid=6  arr[6]=13 < 14 → search right
                         └┘   lo=7  hi=7  mid=7  arr[7]=15 > 14 → lo>hi  NOT FOUND
```

**What it shows**: Binary search in action — lo/hi/mid pointers highlighted on the array, with step-by-step narrowing until match or exhaustion.

---

## Example 5 — Promise / Async State Machine

```
            ┌──────────────┐
            │   pending    │◀─── new Promise(...)
            └──────┬───────┘
                   │
         ┌─────────┴─────────┐
    resolve()           reject()
         │                   │
  ┌──────▼──────┐    ┌───────▼──────┐
  │  fulfilled  │    │   rejected   │
  └──────┬──────┘    └───────┬──────┘
         │                   │
      .then(fn)          .catch(fn)
         │                   │
  ┌──────▼──────────────────▼──────┐
  │         new Promise (chained)  │
  └────────────────────────────────┘
```

**What it shows**: The three internal states of a JavaScript Promise and how `.then()` / `.catch()` chain into new Promises, forming the basis of async pipelines.

---

## Example 6 — CSS Box Model

```
 ┌─────────────────────────────────────────┐
 │                 margin                  │
 │   ┌─────────────────────────────────┐   │
 │   │             border              │   │
 │   │   ┌─────────────────────────┐   │   │
 │   │   │          padding        │   │   │
 │   │   │   ┌─────────────────┐   │   │   │
 │   │   │   │                 │   │   │   │
 │   │   │   │    content      │   │   │   │
 │   │   │   │  width × height │   │   │   │
 │   │   │   └─────────────────┘   │   │   │
 │   │   │                         │   │   │
 │   │   └─────────────────────────┘   │   │
 │   └─────────────────────────────────┘   │
 └─────────────────────────────────────────┘

 box-sizing: content-box  →  total width = content + padding + border + margin
 box-sizing: border-box   →  total width = declared width (padding + border included)
```

**What it shows**: The nested layers of the CSS box model, and how `box-sizing` changes what `width` means.

---

## Example 7 — Git Branch Strategy

```
main     ──●──────────────────────●── merge ──▶
             \                   /
feature/A     ●───●───●─────────╯
                       \
hotfix/1                ●──────────●── cherry-pick ──▶ main
```

```
           [main]
              │  (branch)
       ┌──────┴──────┐
  [feature/A]   [feature/B]
       │               │
  commit · · ·    commit · · ·
       │               │
       └──────┬─────────┘
           [main] (merge)
```

**What it shows**: Feature branches diverging from main and converging back via merge, with an emergency hotfix cherry-picked directly to main.

---

## Example 8 — Event Loop (JavaScript)

```
┌─────────────────────┐
│    Call Stack        │  ◀── sync code runs here
│  [ current frame ]  │
└──────────┬──────────┘
           │  stack empty?
           ▼
┌─────────────────────┐      ┌──────────────────────┐
│  Microtask Queue    │ ◀──  │ Promises / queueMicro │
│  (drained first!)   │      └──────────────────────┘
└──────────┬──────────┘
           │  queue empty?
           ▼
┌─────────────────────┐      ┌──────────────────────┐
│   Macro Task Queue  │ ◀──  │ setTimeout / I/O /   │
│   (one per tick)    │      │ setInterval / events │
└──────────┬──────────┘      └──────────────────────┘
           │
           └──▶ back to Call Stack (next tick)
```

**What it shows**: The event loop's priority ordering — call stack → microtask queue (fully drained) → one macro task — and what feeds each queue.

---

## Example 9 — Linting Pipeline (stratusHue)

```
 documentchange event
        │
        ▼  (debounce 2000ms)
┌───────────────────┐
│  runLintScan()    │
│  lint-engine.ts   │
└────────┬──────────┘
         │  walk every node
         ▼
 ┌──────────────────────────────────┐
 │  per-node checks (lint-checks.ts)│
 │  ┌──────────┐ ┌────────────────┐ │
 │  │fill check│ │text-style check│ │
 │  ├──────────┤ ├────────────────┤ │
 │  │stroke chk│ │effects check   │ │
 │  └──────────┘ └────────────────┘ │
 └───────────────┬──────────────────┘
                 │  LintError[]
                 ▼
        ┌────────────────┐
        │ ui-communication│
        │ postMessage()  │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │  lint-ui.ts    │
        │  render errors │
        └────────────────┘
```

**What it shows**: Data flow from a document change through the lint engine, per-node checks, and back to the UI via postMessage.

---

## Tips for New Diagrams

1. **Start with boxes** — place all nodes first, then draw edges
2. **Horizontal alignment** — use a wide editor, then trim trailing spaces
3. **Check render** — paste into a `\`\`\`` block in a markdown preview before sharing
4. **Avoid diagonal lines** — they break at different font widths; prefer `↘` arrows over `/`
5. **Test ASCII fallback** — if the diagram will live in a code comment, verify it reads as pure ASCII
