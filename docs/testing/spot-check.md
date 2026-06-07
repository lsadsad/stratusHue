# Figma Spot-Check (post-change)

Run after UI, settings, navigate, or bridge changes. **~3 minutes.** Prototype/Playwright tests cover DOM wiring; this confirms real Figma behavior.

## Before you start

```bash
npm run build          # or npm run dev for bridge dev manifest
# Relaunch plugin from manifest.json in Figma
```

Automated gates first:

```bash
npm run validate:full   # type-check, lint, critical tests, build, prototype browser tests
```

---

## Navigate

- [ ] Plugin opens without console errors (Figma → Plugins → Development → stratusHue)
- [ ] Tags / Anchors / Controls sections expand and collapse
- [ ] Emoji add + Shift+click clear on a layer works
- [ ] Save anchor → appears in Anchors list immediately (no manual refresh)

## Date tagger

- [ ] Settings → Date format **Alpha** + position **Suffix** persist after closing/reopening plugin
- [ ] Date button on page title applies today in chosen format/position
- [ ] Re-applying date does not duplicate date tokens

## Bridge (dev manifest only)

- [ ] Settings → Bridge toggle enables footer status dots
- [ ] Local MCP server connected → green local dot (optional if server not running)

## Lint removed

- [ ] No Validate tab / mode strip
- [ ] No Design Lint section in Settings

---

## If something fails

1. Note which checkbox failed
2. Capture: input string → parsed parts → output (for rename/date bugs)
3. Add or extend a Vitest regression test for the exact string/flow if possible

See `docs/fixes/FIGMA_FUNCTIONAL_DEBUG_PLAYBOOK.md` for parser/composer bugs.
