> Canonical source for `CLAUDE-visual-craft.md` — companion to the figma-studio `CLAUDE.md`. **Test layer** pending lived-use verdict. Edit here via surgical MCP edits; copy full text; paste into figma-studio repo to deploy. Last updated: May 18, 2026 (v4.17 session).

---

# CLAUDE-visual-craft.md — AT&T UI principles (test layer)

Operating-layer instructions for Claude Code when the question is about **visual craft** — how a frame is composed, balanced, and rendered — rather than whether the intent landed.

Companion to `CLAUDE.md` (figma-studio). Throughline asks *did the intent land*; this file asks *is the form well-made*. Both must hold.

---

## Status — this is a test layer

This file exists because the gap between Throughline-shaped critique and classical visual-craft critique was leaving Claude Code without an instruction set when asked visual questions.

Whether visual-craft instructions earn a permanent `CLAUDE.md` slot depends on whether Claude Code actually uses them productively in real work. **If you find yourself reaching for these principles often and they help, that's signal. If you find yourself improvising around them, that's also signal.** Flag either.

---

## Source attribution

The nine principles below come from AT&T's Mobile Apps Team UI Principles document, authored by the AD. Throughline positions itself as additive to these — *using* them, not *competing* with them. When applying them, treat the source as canonical. Do not edit AT&T's framing to fit Throughline's register.

---

## The nine UI principles

Each principle: AT&T's framing (faithful), then operational critique questions Claude Code asks when evaluating a Figma frame.

### Balance

**AT&T's framing:** Balance brings stability and clarity to every screen. Whether symmetrical or asymmetrical, it ensures elements work together in harmony — creating a layout that feels intuitive, seamless, and easy to navigate.

**Critique questions:**

- Does visual weight distribute across the frame, or pull to one side without intent?
- Is asymmetry deliberate or accidental?
- Does the layout feel anchored, or does it drift?

### Alignment

**AT&T's framing:** Alignment builds trust. When visual elements are purposefully placed, they create order and clarity. It guides the eye, reinforces structure, and helps users move through content with confidence.

**Critique questions:**

- Do elements align to a clear grid, or float independently?
- Where alignment breaks, does the break carry meaning, or is it accidental?
- Does eye movement follow the alignment, or fight it?

### Repetition

**AT&T's framing:** Repetition creates rhythm and recognition. Reusing familiar colors, shapes, and styles builds consistency that strengthens the brand and helps users feel at home.

**Critique questions:**

- Are recurring elements (icons, buttons, type styles) treated consistently?
- Where repetition breaks, does the break signal something, or is it drift?
- Does the frame echo patterns from other AT&T Relay Design System components users have already seen?

### Contrast

**AT&T's framing:** Contrast brings focus. It highlights what matters — whether through color, size, or typography — and ensures content is readable, accessible, and engaging.

**Critique questions:**

- Does the contrast direct attention to the most important element?
- Are color contrasts meeting WCAG ratios?
- Is type contrast supporting hierarchy, or fighting it?

### Hierarchy

**AT&T's framing:** Hierarchy leads the way. Through thoughtful use of scale, color, and placement, users are guided to what matters most — making complex information feel simple and actionable.

**Critique questions:**

- Can a user identify the primary action in two seconds?
- Does *visual* hierarchy match *semantic* hierarchy (most important = most prominent)?
- Where does the eye go first, second, third? Is that the intended order?

### Emphasis

**AT&T's framing:** Emphasis creates impact. It draws attention to the most important elements — like a call to action or a headline — ensuring users never miss what's essential.

**Critique questions:**

- Is the emphasized element actually the most important?
- Does the emphasis earn its place, or is it competing with other emphasized elements?
- Would removing the emphasis weaken or strengthen the frame?

### White space

**AT&T's framing:** White space gives designs room to breathe. It enhances readability, focus, and flow. It's not empty space; it's intentional space.

**Critique questions:**

- Does the spacing feel intentional, or like default padding?
- Does white space group related elements and separate unrelated ones?
- Are touch targets respecting breathing room without crowding adjacent elements?

### Proportion

**AT&T's framing:** Proportion keeps everything in balance. It defines relationships between elements, ensuring nothing feels out of place.

**Critique questions:**

- Do element sizes reflect their importance?
- Are scale ratios consistent across the frame?
- Does anything feel oversized or undersized for its semantic weight?

### Accessibility

**AT&T's framing:** Accessibility is a promise. Design for everyone — regardless of ability — by ensuring content is readable, navigation is inclusive, and interactions are respectful.

**Critique questions:**

- Is the frame readable at minimum font sizes per platform guidelines?
- Are color contrasts meeting WCAG AA at minimum?
- Are touch targets at least 44pt × 44pt?
- Does the frame work with screen readers (semantic structure, alt text, labelled controls)?
- Does it survive `prefers-reduced-motion`?
- Does it work in both light and dark mode?

---

## How this file works alongside the Throughline file

When critiquing a Figma frame, run both:

- **Throughline critique** (Dual Read in `CLAUDE.md`) — did the intent land?
- **Visual-craft critique** (the nine principles above) — is the form well-made?

When they disagree:

- **Throughline passes, visual craft fails** — the intent is right but the rendering undermines it. Fix the craft, not the intent.
- **Throughline fails, visual craft passes** — the rendering is competent but the connection isn't landing. Re-examine the intent layer.
- **Both fail** — re-examine from scratch. Don't patch.
- **Both pass** — ship.

**Don't confuse a visual-craft fix for an intent fix, and don't confuse an intent fix for a visual-craft fix.**

---

## Token-level questions defer further

These principles are evaluative, not prescriptive. For specific tokens — color values, type scale, spacing increments — defer to the **AT&T Relay Design System**.

If a question is "is this color right?" the answer chain is:

1. Is the color from an AT&T Relay Design System token?
2. Does the contrast meet WCAG?
3. Does the color direct attention to the right element?
4. Does the color match the intent the screen is communicating? (That's the Throughline file's question.)

---

## When in doubt

- These principles are AT&T's, not Throughline's. Treat them as imported, not authored.
- If a visual-craft question feels meta (about connection, intent, or extraction), it belongs in the Throughline file, not here.
- Don't generate new visual-craft principles. If the nine above don't cover a case, surface the gap rather than inventing.
- This is a test layer. Use it. Flag what works and what doesn't.

---

*Imported principles. Not Throughline canon. Test layer pending lived-use verdict.*
