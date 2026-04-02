# Figma Functional Debug Playbook (AI)

This playbook captures a resolved real-world bug and the debugging workflow that produced a reliable fix.

## Incident Summary

- **Symptom:** Updating page emoji on certain titles prepended a new emoji without removing the old one.
- **Repro title:** `    ↳ 🟠 Dev Hand Off - MVP Add On Entry Point - 03.09.2026 STALE`
- **Observed bad output:** `    ↳ 🔵 🟠 Dev Hand Off - ...`

## Root Cause (Confirmed)

- `parsePageTitleParts()` handled unstructured titles (`no ":"`) with a fallback that removed only `↳`, not the leading emoji.
- `composePageTitle()` then prepended the newly selected emoji while `title` still contained the old emoji.
- Result: duplicated emoji in composed page name.

## Fix (Implemented)

- In `src/utils/utils.ts` inside `parsePageTitleParts()`:
  - For unstructured names (`afterColon.length === 0`), strip the leading emoji from the fallback `title` using `detectLeadingEmoji()`.
  - Keep structured (`:`) path behavior unchanged.

## Runtime Evidence Pattern to Reuse

For parser/composer bugs, instrument and verify these checkpoints:

1. Entry value (`oldName`)
2. Parsed parts (`emoji`, `title`, `date`, `leadingSpaces`)
3. Final composed name (`newName`)

Expected healthy signal for this class of issue:

- Parsed `title` should **not** include the original leading emoji once replacement is requested.
- Composed output should contain exactly one emoji token after `↳`.

## Functional Testing Rules for Figma

- Use **real Figma runtime** for node-dependent behavior (selection, page names, bookmarks, plugin data).
- Prototype (`prototype/plugin.html`) is useful for UI-only checks, but **not authoritative** for document/node mutations.
- Always rebuild before manual Figma verification:

```bash
npm run build
```

- Relaunch the dev plugin from `manifest.json` after rebuild.

## Suggested Regression Cases

1. Indented unstructured title with emoji + date-like text in body
2. Structured title with colon (`↳ 🟠 03.09 : Title`)
3. No existing emoji (`↳ Title`)
4. Clear emoji after update
5. Same flow with active selection (layer path must remain unaffected)

