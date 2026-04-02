# ASCII / Unicode Character Palette

Quick-reference for every symbol used in diagrams. Copy-paste ready.

---

## Box-Drawing (Unicode — preferred)

### Single-line
| Symbol | Name | Use |
|--------|------|-----|
| `─` | Horizontal | Top/bottom edges, horizontal connectors |
| `│` | Vertical | Left/right edges, lifelines |
| `┌` | Top-left corner | Box top-left |
| `┐` | Top-right corner | Box top-right |
| `└` | Bottom-left corner | Box bottom-left |
| `┘` | Bottom-right corner | Box bottom-right |
| `├` | Left T-junction | Tree branches, table left edge |
| `┤` | Right T-junction | Table right edge |
| `┬` | Top T-junction | Table column header |
| `┴` | Bottom T-junction | Table footer |
| `┼` | Cross | Table interior cell |

### Double-line (emphasis / headers)
| Symbol | Name | Use |
|--------|------|-----|
| `═` | Double horizontal | Double-border top/bottom |
| `║` | Double vertical | Double-border sides |
| `╔` | Double top-left | Section header box |
| `╗` | Double top-right | Section header box |
| `╚` | Double bottom-left | Section header box |
| `╝` | Double bottom-right | Section header box |
| `╠` | Double left T | Layer divider |
| `╣` | Double right T | Layer divider |
| `╦` | Double top T | Double table header |
| `╩` | Double bottom T | Double table footer |
| `╬` | Double cross | Double table interior |

### Mixed (single horizontal + double vertical)
`╞ ╡` — rarely needed, use only for special emphasis

---

## Arrows

### Unicode directional
| Symbol | Use |
|--------|-----|
| `→` `←` | Horizontal flow, dependency direction |
| `↑` `↓` | Vertical flow, stack growth |
| `↗` `↘` `↙` `↖` | Diagonal connections (use sparingly) |
| `↔` | Bidirectional horizontal |
| `↕` | Bidirectional vertical |
| `⇒` `⇐` | Strong / transform arrows |
| `⇔` | Equivalence |
| `↺` `↻` | Loops, cycles |

### Box-end arrows (composed)
```
──▶   outgoing arrow (right)
◀──   incoming arrow (left)
◀──▶  bidirectional
──▷   hollow arrowhead (optional / weaker dependency)
- - ▶ dashed arrow (async, optional, future)
```

### Pure ASCII fallback
```
-->   ->   =>   =>   <-   <--   <=>
^         |         v
|         v         |
```

---

## Nodes / Shapes (inline)

| Symbol | Use |
|--------|-----|
| `●` | Filled node, start state |
| `○` | Hollow node, end state |
| `◆` | Decision / diamond |
| `◇` | Hollow diamond (optional decision) |
| `■` | Filled square, emphasis |
| `□` | Hollow square, placeholder |
| `▶` / `▷` | Play / forward / collapse |
| `▲` / `△` | Up indicator, heap top |
| `▼` / `▽` | Down indicator, stack grows down |
| `★` | Important / starred item |
| `✓` | Correct / present |
| `✗` | Incorrect / absent |
| `⊕` | XOR, merge point |
| `⊗` | Error point |
| `◀` | Back arrow head |

---

## Progress / Fill

| Symbol | Use |
|--------|-----|
| `█` | Full block (progress bar, gantt active) |
| `▓` | Dark shade (partial fill) |
| `▒` | Medium shade (50%) |
| `░` | Light shade (low/waiting) |
| `·` or `•` | Dot trail / padding |

---

## Separators / Structure

```
═══════════════   thick horizontal rule (major section)
───────────────   thin horizontal rule (minor separator)
- - - - - - -    dashed rule (optional / future)
~~~~~~~~~~~~~~~   wavy rule (approximation / loose boundary)
```

---

## Cardinality (ERD)

```
1──────1    one-to-one
1──────<    one-to-many
>──────<    many-to-many
0──────<    zero-or-many (optional)
```

---

## Pure ASCII Fallback Set

When output goes into code comments or plain terminals, use only these:

```
Boxes:    + - | (corners: +, sides: - and |)
Arrows:   -> <- => <= --> <-- <=> >> <<
Trees:    / \ |
Fill:     # = . ~ *
Labels:   [label] (note) {group} <type>
Decision: ? yes: no:
```

Example ASCII-only box:
```
+------------------+
|   Component      |
+------------------+
```

---

## Tips

- **Consistent width**: pad labels to the same length so boxes align: `│ Label    │`
- **Space inside**: always add at least one space inside box walls: `│ text │` not `│text│`
- **Renderer check**: Unicode box characters look correct in VS Code, GitHub markdown, and most web renderers. They break in some terminals with narrow fonts — provide ASCII fallback if needed.
- **Monospace requirement**: these characters ONLY look right in monospace/code blocks (```` ``` ````)
- **Copy tip**: set up a text-expander snippet for `┌─┐│└┘` to avoid re-typing
