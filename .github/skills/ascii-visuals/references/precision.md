# Pixel-Perfect Technique

ASCII diagrams look "off" for one root cause: **column positions weren't planned before drawing**. This reference gives a repeatable method for alignment-perfect output.

---

## The Grid-Planning Method

### Step 1 — Define column centers before drawing anything

For every participant (or box column), assign an exact character position for its center/lifeline. Write these down:

```
# Participant → lifeline char position
Browser        → col 8
CDN            → col 28
Origin Server  → col 48
Database       → col 66
```

### Step 2 — Draw a ruler line (then delete it)

Temporarily insert this ruler as line 1 to verify positions while building:

```
0         1         2         3         4         5         6         7
0123456789012345678901234567890123456789012345678901234567890123456789012345
```

Count to your planned column centers. If the `│` doesn't land on the right number, adjust spacing before going further.

### Step 3 — Place headers by centering labels over their lifeline

Formula: `left_pad = floor((col_width - label_length) / 2)`

For a 20-char column with label "CDN" (3 chars): `floor((20-3)/2) = 8` spaces on the left, 9 on the right.

### Step 4 — Draw lifelines first, arrows second

Always lay out the bare skeleton before adding message labels:

```
   Client               Server              Database
      │                    │                    │
      │                    │                    │
      │                    │                    │
```

Verify each `│` sits at its planned column before adding any arrows.

### Step 5 — Fill arrows by counting, not eyeballing

For an arrow from lifeline at col A to lifeline at col B going right:
- Source side: `│` at col A
- Fill: `─` repeated for `B - A - 2` chars
- Arrowhead: `▶` at col B - 1
- Target: `│` at col B

Label placement: replace the middle `─` chars with ` label ` (space-padded).

**Example**: arrow from col 8 to col 28 (20-char gap):
- Fill = 20 - 2 = 18 chars
- ` GET /page ` = 11 chars → pad to 18: `── GET /page ─────`
- Full row: `        │── GET /page ─────▶│`

---

## Character Choices for Clean Rendering

### Lifelines
| Style | Char | Use |
|-------|------|-----|
| Active (doing work) | `│` | Default — participant is involved |
| Idle (waiting) | `┊` | Participant exists but not yet involved |
| Optional / future | `╎` | Participant may or may not be created |

### Arrowheads
| Direction | Filled | Hollow |
|-----------|--------|--------|
| Right | `──▶` | `──▷` |
| Left | `◀──` | `◁──` |
| Dashed right | `╌╌▶` | `- - ▶` |
| Async | `──⇒` | |

**Use hollow `▷` / `◁` for**: return messages, optional calls, async.  
**Use filled `▶` / `◀` for**: synchronous calls, mandatory messages.

### Decision blocks in sequence diagrams
Instead of inline text that breaks alignment, use a box straddling the lifeline:

```
          ╔════════════╗
          ║ cache HIT? ║
          ╚══╤═════╤═══╝
           yes     no
```

Keep the box entirely within one column's width. Text outside the box goes on the same line as the branch arrows, flush to the decision sides.

---

## Corrected HTTP Request Example

Column plan (72-char total):
```
 Browser     CDN      Origin Srv   Database
    │   col 8  │  col 26  │  col 46   │  col 62
```

```
   Browser          CDN         Origin Server     Database
      │               ┊               ┊               ┊
      │── GET /page ─▶│               ┊               ┊
      │               │               ┊               ┊
      │          ╔════╧══════╗        ┊               ┊
      │          ║ cache HIT?║        ┊               ┊
      │          ╚══╤════╤═══╝        ┊               ┊
      │           yes│    │no         ┊               ┊
      │◀── 200 ──────┘    │           ┊               ┊
      │                   │── fwd ───▶│               ┊
      │                   ┊           │── SELECT ─────▶
      │                   ┊           │◀── rows ───────
      │                   ┊           │               │
      │◀──────────────────│◀── 200 ───│               │
      │                   ┊      (+cache)             ┊
      │               ┊               ┊               ┊
```

Improvements vs. the original:
- `┊` for idle lifelines — visually distinguishes "waiting" from "active"
- Decision block in a `╔╗╚╝` box that doesn't resize or shift the columns
- Arrows fill exactly to their target `│` or `▶`
- Branch text (`yes │`, `│no`) sits flush to the decision box legs

---

## Alignment Checklist

Run through this before finalizing any diagram:

- [ ] Every lifeline `│` sits at its planned column position
- [ ] Arrow tails start one char right of the source lifeline
- [ ] Arrowheads land one char left of the target lifeline (then `│`)
- [ ] No label text extends past its column boundary
- [ ] Boxes are the same width as their content + 2 (for `│ ` padding)
- [ ] Ruler-checked: viewed in a monospace font at size 12–14 renders cleanly

---

## Label Overflow Rule

**Never widen a column to fit a label.** Widening one column shifts every column to its right, breaking the whole grid.

Instead, do one of these — in priority order:

| Situation | Fix |
|-----------|-----|
| Label > arrow gap | Abbreviate: `(+ cache store)` → `(+cache)` → `+C` |
| Label barely fits | Drop spaces: `── fwd ──▶` instead of `─ forward ──▶` |
| Two-part label | Put part 1 on arrow line, part 2 as an indented note *below the entire diagram* |
| Return value label | Put it on the return arrow line, not on a second line below |

Example — the `(+cache)` problem:

```
# BAD — wraps to second line, lifeline disappears
     │◀──────────────│◀── 200 ──│
     │               ┊    (+cache store)      ← this line has no lifeline chars

# GOOD — inline abbreviation
     │◀──────────────│◀─ 200 (+cache) ─│
```

If the inline version still overflows, use a footnote:
```
     │◀─────────────│◀── 200 [1] ──│
...
[1] CDN stores response in cache before forwarding to browser
```

## Lifeline Continuity Rule

Every lifeline `│` or `┊` must appear on **every row** of the diagram, including:
- Rows with arrows (the source and target lifelines appear, intermediaries use `┊`)
- Rows with decision boxes (lifeline runs through the box with `╧` / `╤`)
- Label-only rows (the `(+cache)` row, the `yes │ no` row)
- Blank spacing rows between messages

If a lifeline disappears mid-diagram, add the missing `│` or `┊` character at its column position even on "label" rows. The column grid never has gaps.

## Quick Width Calculator

```
col_width  = max(label_length, min_arrow_label_length) + 4
arrow_fill = right_col_center - left_col_center - 2
label_pad  = arrow_fill - label_length - 2   (split evenly: half before, half after)
```

Example: col centers at 8 and 28 (gap = 20):
- `arrow_fill = 20 - 2 = 18`
- label "GET /page" (9 chars): padding = 18 - 9 - 2 = 7 → split: 3 left, 4 right
- Result: `──── GET /page ────▶` ... wait, that's 4+1+9+1+4+1 = 20? no.
- `─`: 3 + space + `GET /page` (9) + space + 4 dashes + `▶` = 3+1+9+1+4+1 = 19 → starts 1 right of lifeline, lands 1 left of target. ✓

---

## Font Matters

Unicode box-drawing characters render at exactly 1 character width in:
- VS Code (`Fira Code`, `JetBrains Mono`, `Cascadia Code`)
- GitHub markdown code blocks
- Most terminal emulators

They break in:
- Proportional fonts (Word, Google Docs)
- Some older terminal fonts where `─` renders at 0.5× or 1.5× width

**If your diagram must survive copy-paste into unknown environments**, use the pure ASCII fallback set (`+ - | / \`) documented in [palette.md](./palette.md).
