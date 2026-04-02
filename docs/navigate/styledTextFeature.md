# Styled Text Feature Specification

## Overview
Add a Styled Text group to the Controls section that allows designers to paste rich text from the web into Figma with formatting preserved, and copy styled Figma text layers as HTML to the clipboard. When copying text from a browser and pasting it into Figma natively, all formatting is stripped — bold, italic, colors, font sizes, links, and list structure are lost. This feature bridges that gap by parsing clipboard HTML and applying styles via Figma's range-based text API.

## Status
⏸ **Paused / Hidden** — code is fully implemented but the section is disabled until clipboard issues are resolved.

To re-enable: flip `styledText: false → true` in four places:
- `src/ui.ts` → `let groupStyledTextVisible = false`
- `src/code.ts` → `defaultGroups.styledText`, `stored.styledText ?? false`, error-fallback groups object
- `prototype/shim.js` → `controls-group-settings` mock

## Known Blockers

### 1. Paste — `navigator.clipboard` unavailable in Figma's web iframe
Figma's plugin iframe sandbox does not expose the Clipboard API (`navigator.clipboard` is `undefined`).
The primary `navigator.clipboard.read()` path throws immediately and falls back to the
`contenteditable + execCommand('paste')` approach. However, `execCommand('paste')` is also
blocked in Figma's sandboxed iframe (returns `false`), meaning **the Paste button does nothing**
in the Figma web client. A user-facing "clipboard not available" notification fires, but no text
is pasted. This may work in the Figma desktop app (Electron), which has a different security model.

**To investigate:** Test on the Figma desktop app to confirm whether `execCommand('paste')` or
`navigator.clipboard.read()` works there. If not, the paste flow requires a fundamentally
different approach — possibly a text input field the user explicitly pastes into, which then
triggers the parse-and-send flow without relying on programmatic clipboard access.

### 2. Copy — `execCommand('copy')` fallback works but only copies plain text
The `navigator.clipboard.write()` path with `ClipboardItem({ 'text/html': ... })` also fails
(same sandbox restriction). The fallback uses `execCommand('copy')` with a `copy` event interceptor
to set `text/html` and `text/plain` on the clipboard — this works, but needs testing to confirm
rich-text paste actually preserves formatting in Google Docs / Notion / Slack.

### 3. `aria-hidden` + focus conflict in paste fallback
When `execCommand('paste')` fails (which it does in Figma web), the `#styled-text-clipboard` div
briefly receives focus and then has `aria-hidden` restored. The browser logs an accessibility
violation. The current fix calls `blur()` before restoring `aria-hidden`, but the violation still
appears in some Figma sessions — likely a timing issue with when the browser commits the attribute
vs. when focus is transferred. The entire contenteditable-based paste approach should be replaced.

## Strategic Context

### Mode: Navigate
Styled Text is a **Navigate** mode feature — a productivity tool for active design work. It sits alongside Bookmarks, Emoji Tags, Sizing Modes, and other controls that help designers work efficiently within a file.

Content teams use this during the design phase to import formatted copy from Docs/Notion/Confluence and export styled text back for review. The primary workflow is mid-flight content iteration.

> **Future integration note**: Styled Text could eventually become part of a **Scaffold** workflow — seeding template pages with real content during project kickoff. This is a natural extension but not the initial placement.

See also: `docs/validate/designLintFeature.md` for the full three-mode framework (Scaffold / Navigate / Validate).

## Motivation

### The Problem
Copying text from a web page (documentation, specs, content drafts) and pasting into Figma produces a single, flat, unstyled text block. Designers must then manually re-apply every style — bold, italic, headings, colors, links — which is tedious and error-prone for long-form content.

### The Solution
A two-button Controls group that:
1. **Paste Styled** — reads `text/html` from the clipboard, parses the HTML into style segments, and creates a properly styled TextNode in Figma
2. **Copy Styled** — reads the selected TextNode's style segments and writes formatted HTML to the clipboard for pasting into other tools

## UI Design

### Placement
New collapsible group inside the Controls section (`#controls-section`), after Sizing Modes (`#sizing-modes-group`). Follows the same `section-header` → `collapsible-content` pattern as existing groups.

### Layout
2-button grid matching the Sizing Modes group pattern (`.actions-grid`):

| Button | Icon | Accent | Action |
|--------|------|--------|--------|
| Paste Styled | Clipboard/Aa glyph | `--theme-info` (blue) | Reads clipboard HTML → creates styled TextNode |
| Copy Styled | `</>` bracket glyph | `--theme-success` (green) | Reads selected TextNode → writes HTML to clipboard |

### Toggle: "Replace selected"
- **OFF** (default): Paste creates a new TextNode on the canvas
- **ON**: Paste replaces the content of the currently selected TextNode, preserving its position, constraints, and auto-layout properties

### Contextual Hint
Muted caption text below the controls: *"Copy from web, then click Paste Styled"*

### Width Compatibility
Two buttons at ~74px each fit within the 188px minimum plugin width with standard `--spacing-md` gutters.

## What To Add

### 1. UI Section (ui.html)
- New collapsible section titled "STYLED TEXT" with 📋 icon
- Two buttons following `.nav-button` class pattern:
  - **Paste Styled**: triggers clipboard read and paste flow
  - **Copy Styled**: triggers read-from-selection and clipboard write flow
- Toggle row for "Replace selected" mode
- Hidden `contenteditable` div for clipboard access (off-screen, `aria-hidden="true"`)
- Follows existing plugin design patterns with full accessibility support
- Located after the Sizing Modes section

### 2. UI Logic (ui.ts)
- Add event listeners for both buttons in `setupNavigationControls()` or a new `setupStyledTextControls()` function
- **Paste flow**:
  1. Trigger `document.execCommand('paste')` on hidden contenteditable div
  2. Listen for `paste` event on the div
  3. Read `e.clipboardData.getData('text/html')` (fallback to `text/plain`)
  4. Parse HTML into flat style segments via `parseHTMLToSegments()`
  5. Send segments to plugin sandbox via `postMessage({ type: 'paste-styled-text', segments, replaceSelected })`
- **Copy flow**:
  1. Send `{ type: 'copy-styled-text' }` to plugin sandbox
  2. Receive `{ type: 'styled-text-html', html }` back from sandbox
  3. Write HTML to clipboard via `navigator.clipboard.write()` with `text/html` MIME type
- **HTML parser** (`parseHTMLToSegments()`):
  1. Parse HTML string with `new DOMParser().parseFromString(html, 'text/html')`
  2. Recursively walk the DOM tree
  3. Accumulate inherited styles from tags (`<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<a>`, `<h1>`-`<h6>`, `<li>`)
  4. Read inline CSS (`style.fontSize`, `style.color`, `style.fontWeight`)
  5. Insert newlines for block elements (`<p>`, `<div>`, `<br>`, `<li>`, headings)
  6. Return flat array of `{ characters, bold, italic, underline, fontSize, color, link }` segments
- Add `updateStyledTextButtons()` to enable/disable Copy button based on selection
- Add message handler for `update-styled-text-state` messages from plugin

### 3. Plugin Logic (code.ts)
- **Paste handler** (`handlePasteStyledText()`):
  1. Receive segments array from UI
  2. Determine unique font variants needed (Regular, Bold, Italic, Bold Italic)
  3. Load all required fonts via `figma.loadFontAsync()`
  4. If `replaceSelected` is true and a TextNode is selected, use that node; otherwise `figma.createText()`
  5. Set `textNode.characters` to the concatenated plain text
  6. Iterate segments and apply per-range styles:
     - `setRangeFontName(start, end, { family, style })` for bold/italic
     - `setRangeFontSize(start, end, size)` for font size
     - `setRangeFills(start, end, [{ type: 'SOLID', color: { r, g, b } }])` for text color
     - `setRangeTextDecoration(start, end, 'UNDERLINE')` for underline
     - `setRangeHyperlink(start, end, { type: 'URL', value: url })` for links
  7. Append to `figma.currentPage` and scroll into view (if new node)
  8. Send success notification
- **Copy handler** (`handleCopyStyledText()`):
  1. Validate selection contains a TextNode
  2. Call `textNode.getStyledTextSegments(['fontSize', 'fontName', 'fills', 'textDecoration', 'hyperlink'])`
  3. Convert segments to HTML string (wrap in `<b>`, `<i>`, `<u>`, `<span style="...">`, `<a href="...">`)
  4. Send HTML string back to UI via `postMessage({ type: 'styled-text-html', html })`
- **Selection state** (`sendStyledTextStateToUI()`):
  1. Check if selection contains at least one TextNode
  2. Send `{ type: 'update-styled-text-state', hasTextNode: boolean }` to UI
  3. Integrate into selection change debouncer

## Technical Details

### Message Flow — Paste

```
User clicks "Paste Styled"
       ↓
UI: execCommand('paste') on hidden contenteditable div
       ↓
UI: paste event → clipboardData.getData('text/html')
       ↓
UI: DOMParser walks HTML tree → flat segments array
       ↓
UI → Plugin: postMessage({ type: 'paste-styled-text', segments, replaceSelected })
       ↓
Plugin: loadFontAsync() for all required font variants
       ↓
Plugin: createText() or use selected TextNode
       ↓
Plugin: textNode.characters = concatenated plain text
       ↓
Plugin: setRangeFontName/Size/Fills/Decoration/Hyperlink per segment
       ↓
Plugin: appendChild + scrollAndZoomIntoView
       ↓
Plugin → UI: postMessage({ type: 'notify', message: '✓ Styled text pasted' })
```

### Message Flow — Copy

```
User clicks "Copy Styled"
       ↓
UI → Plugin: postMessage({ type: 'copy-styled-text' })
       ↓
Plugin: getStyledTextSegments() on selected TextNode
       ↓
Plugin: convert segments → HTML string
       ↓
Plugin → UI: postMessage({ type: 'styled-text-html', html })
       ↓
UI: navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
       ↓
UI: show toast '✓ Styled text copied'
```

### Segment Data Structure

```typescript
interface StyledTextSegment {
  characters: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: { r: number; g: number; b: number };  // normalized 0-1
  link?: string;
  fontFamily?: string;
}
```

### HTML Tag → Style Mapping

| HTML Tag / CSS | Figma API Call | Value |
|---|---|---|
| `<b>`, `<strong>`, `font-weight >= 700` | `setRangeFontName()` | `{ family, style: 'Bold' }` |
| `<i>`, `<em>` | `setRangeFontName()` | `{ family, style: 'Italic' }` |
| `<b>` + `<i>` combined | `setRangeFontName()` | `{ family, style: 'Bold Italic' }` |
| `<u>` | `setRangeTextDecoration()` | `'UNDERLINE'` |
| `<s>`, `<del>` | `setRangeTextDecoration()` | `'STRIKETHROUGH'` |
| `<a href="...">` | `setRangeHyperlink()` | `{ type: 'URL', value: href }` |
| `font-size: Xpx` | `setRangeFontSize()` | `X` (number) |
| `color: rgb(r,g,b)` | `setRangeFills()` | `[{ type: 'SOLID', color }]` |
| `<p>`, `<div>`, `<br>` | newline in characters | `\n` |
| `<h1>`-`<h6>` | `setRangeFontSize()` + bold | Scaled sizes + `'Bold'` |
| `<li>` | prefix in characters | `"• "` + content + `\n` |

### Font Loading Strategy

Before setting any text content, the plugin must:
1. Collect all unique `{ family, style }` combinations from the segments
2. Default to `{ family: 'Inter', style: 'Regular' }` when not specified
3. Call `figma.loadFontAsync()` for each variant
4. Use `Promise.all()` to load in parallel
5. Only then set `textNode.characters` and apply range styles

### Color Parsing

The UI-side parser must handle multiple CSS color formats:
- `rgb(r, g, b)` → normalize each channel to 0-1 by dividing by 255
- `rgba(r, g, b, a)` → same normalization, ignore alpha
- `#rrggbb` → parse hex to decimal, normalize to 0-1
- `#rgb` → expand to 6-digit hex, then parse
- Named colors → lookup table to hex, then parse

## Features

### Core Functionality
✅ Paste rich text from clipboard with formatting preserved
✅ Copy selected TextNode as styled HTML to clipboard
✅ Support bold, italic, underline, font size, text color, hyperlinks
✅ Handle block elements (paragraphs, line breaks, headings, list items)
✅ Replace mode: paste into selected TextNode preserving position
✅ Create mode: paste as new TextNode on the canvas
✅ Load required font variants automatically before applying styles

### User Experience
✅ 2-button layout matching existing Sizing Modes group
✅ Collapsible section following existing Controls pattern
✅ Toggle for replace vs. create mode
✅ Contextual hint text for discoverability
✅ Copy button disabled when no TextNode is selected
✅ Toast notifications for success/error feedback
✅ Graceful fallback to plain text when HTML parsing fails
✅ Full accessibility support (ARIA labels, keyboard navigation, screen reader)

## Files To Modify

1. **src/ui.html**
   - Add Styled Text section markup after Sizing Modes group
   - Add hidden contenteditable div for clipboard access

2. **src/ui.ts**
   - Add `parseHTMLToSegments()` function
   - Add `parseColor()` helper function
   - Add `setupStyledTextControls()` function with event listeners
   - Add `updateStyledTextButtons()` function
   - Add paste event listener on hidden contenteditable div
   - Add message handlers for `styled-text-html` and `update-styled-text-state`

3. **src/code.ts**
   - Add `handlePasteStyledText()` function
   - Add `handleCopyStyledText()` function
   - Add `sendStyledTextStateToUI()` helper function
   - Add `segmentsToHTML()` helper function
   - Add message handlers for `paste-styled-text` and `copy-styled-text`
   - Integrate `sendStyledTextStateToUI()` into selection change debouncer

4. **src/styles.css**
   - Add `.styled-text-toggle` styles for the replace mode toggle
   - Reuse existing `.actions-grid`, `.nav-button`, `.caption-text` classes

## Testing Checklist

### Basic Functionality
- [ ] Styled Text section appears in Controls after Sizing Modes
- [ ] Section is collapsible like other sections
- [ ] Paste Styled button is always enabled
- [ ] Copy Styled button is disabled when no TextNode is selected

### Paste Tests
- [ ] Copy bold text from a web page → paste → bold is preserved
- [ ] Copy italic text → paste → italic is preserved
- [ ] Copy colored text → paste → color is preserved
- [ ] Copy text with links → paste → hyperlinks are preserved
- [ ] Copy text with mixed sizes → paste → font sizes are preserved
- [ ] Copy a bulleted list → paste → list items with bullet prefixes
- [ ] Copy headings → paste → larger/bold text
- [ ] Copy multi-paragraph text → paste → newlines between paragraphs
- [ ] Copy plain text (no HTML) → paste → creates plain TextNode

### Replace Mode Tests
- [ ] Toggle ON, select a TextNode → paste replaces its content
- [ ] Toggle ON, no TextNode selected → paste creates new TextNode (fallback)
- [ ] Toggle OFF → paste always creates new TextNode
- [ ] Replaced TextNode preserves position, constraints, and auto-layout properties

### Copy Tests
- [ ] Select a styled TextNode → click Copy → HTML is on clipboard
- [ ] Paste the copied HTML into a rich text editor → styles preserved
- [ ] Select a plain TextNode → click Copy → clean HTML output
- [ ] No TextNode selected → Copy button disabled

### Edge Cases
- [ ] Empty clipboard → graceful error with toast notification
- [ ] Clipboard contains image only → fallback to "No text found" message
- [ ] Very long text (1000+ characters) → performance is acceptable
- [ ] Text with unsupported fonts → falls back to Inter
- [ ] Text with nested formatting (bold + italic + underline + color) → all applied
- [ ] RTL text → characters preserved correctly

### Accessibility
- [ ] Buttons have proper ARIA labels
- [ ] Toggle has `role="switch"` and `aria-checked`
- [ ] Keyboard navigation works (Tab to reach buttons)
- [ ] Enter/Space activates buttons
- [ ] Screen reader announces success/error toasts
- [ ] Hidden contenteditable div is `aria-hidden="true"`

## Usage Instructions

### Pasting Styled Text from the Web
1. **Copy text** from any web page, Google Doc, Notion, or other rich text source
2. **Open stratusHue** and expand the Controls → Styled Text section
3. **Click Paste Styled** — the formatted text appears as a new TextNode on the canvas
4. To replace an existing text layer instead, toggle **Replace selected** ON and select the target TextNode first

### Copying Styled Text from Figma
1. **Select a text layer** in Figma
2. **Click Copy Styled** — the text and its formatting are copied as HTML
3. **Paste** into any rich text editor (Google Docs, Notion, Slack, email) — styles are preserved

## Constraints

- **No network access**: all parsing happens client-side in the UI iframe; no external dependencies
- **Font availability**: the plugin can only apply fonts available in the Figma file; defaults to Inter when a web font is unavailable
- **Clipboard security**: `navigator.clipboard` may require user gesture or focus; the hidden contenteditable + `execCommand('paste')` approach is the reliable fallback
- **manifest.json**: no changes needed — `"allowedDomains": ["none"]` is sufficient since everything is local clipboard operations

## Next Steps

1. **Implement the HTML parser** (`parseHTMLToSegments()`):
   - Start with core tags: `<b>`, `<i>`, `<u>`, `<a>`, `<br>`, `<p>`, `<li>`
   - Add inline CSS support: `font-size`, `color`, `font-weight`
   - Add color parsing utility

2. **Implement the plugin sandbox handlers**:
   - `handlePasteStyledText()` with font loading and range-based styling
   - `handleCopyStyledText()` with `getStyledTextSegments()` and HTML generation

3. **Build the UI section**:
   - HTML markup following existing section patterns
   - Button event listeners and toggle state
   - Hidden contenteditable div for clipboard access

4. **Test across sources**:
   - Google Docs, Notion, Confluence, web pages, Slack
   - Verify consistent parsing results

5. **Update README.md** once implementation is complete:
   - Add feature entry under Sizing Modes
   - Update Basic Usage section

## Related Files

- Feature specification: This document
- UI reference: `docs/navigate/layoutSizingFeature.md` (similar 2-button pattern)
- Plugin architecture: `docs/shared/currentPluginStructureAnalysis.md`
- Accessibility patterns: `docs/navigate/accessibilityImplementationSummary.md`
- UI HTML: `src/ui.html`
- UI TypeScript: `src/ui.ts`
- Plugin code: `src/code.ts`
- Styles: `src/styles.css`
