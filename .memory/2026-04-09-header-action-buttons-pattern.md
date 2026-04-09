---
type: context
tags: [navigate, ui, pattern]
---

# Header Action Buttons — removed but reusable

Removed from `src/ui/navigate/navigate-ui.ts` (line ~236) on 2026-04-09 to fix lint error. The pattern collects all header action buttons into a typed array, useful for batch operations (disable/enable, visibility toggling, keyboard nav).

```typescript
const headerActionButtons: HTMLElement[] = [
  newPageBtn,
  dateBtn,
  clearBtn,
  saveBtn,
  refreshAnchorsBtn,
  backBtn,
  forwardBtn
].filter((btn): btn is HTMLElement => btn instanceof HTMLElement);
```

Restore in `setupEventListeners()` when needed for bulk button state management.
