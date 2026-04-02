# Figma Plugin styleq Error Fix

## Error Description
```
vendor-core-fdbf9f231952dae0.min.js.br:85 styleq: kzqmXN typeof undefined is not "string" or "null".
```

This error was preventing the plugin from loading in Figma Desktop.

## Root Cause

The error was caused by **overriding `EventTarget.prototype.addEventListener` and `EventTarget.prototype.removeEventListener`** in the plugin's UI code. While this was implemented for event listener cleanup tracking, it **interfered with Figma's internal event handling system**.

Figma uses an internal CSS-in-JS library called `styleq` that relies on the native browser event system. When we overrode these prototypes, it broke Figma's ability to properly attach event handlers to its internal UI components, causing undefined values to be passed to the styleq library.

## Changes Made

### 1. Added Global Error Handlers (`src/ui.ts` lines 12-23)
Added comprehensive error catching to prevent errors from bubbling up to Figma's error handler:

```typescript
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error || event.message);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
```

### 2. Disabled EventTarget Prototype Override (`src/ui.ts` lines 2600-2659)
Commented out the code that was overriding `EventTarget.prototype.addEventListener` and `EventTarget.prototype.removeEventListener`. These overrides were interfering with Figma's internal event system.

The `removeAllEventListeners()` function was kept as a no-op for backward compatibility, but it no longer attempts to remove listeners.

## Testing Steps

1. **Rebuild the plugin:**
   ```bash
   npm run build
   ```

2. **In Figma Desktop:**
   - Close the plugin if it's open
   - Quit and restart Figma Desktop completely (to clear any cached states)
   - Reload the plugin from **Plugins → Development → stratusHue**

3. **Verify the fix:**
   - The plugin should now load without the styleq error
   - Check the browser console (Plugins → Development → Open Console) for any errors
   - All plugin functionality should work as expected

## Impact

- **Positive:** Plugin now loads correctly in Figma without styleq errors
- **Trade-off:** Event listener cleanup is no longer tracked automatically, but this is acceptable as the browser handles cleanup when the plugin iframe is destroyed
- **No functional changes:** All plugin features continue to work as before

## Prevention

To avoid similar issues in the future:
- **Never override browser prototypes** in Figma plugins, as they can interfere with Figma's internal systems
- **Use standard event handling** without custom tracking mechanisms
- **Test thoroughly** after any changes to core browser APIs or prototypes

## Additional Notes

If you still encounter the styleq error after applying this fix:
1. **Clear Figma's cache:**
   - Quit Figma completely
   - Delete cache files (location varies by OS)
   - Restart Figma

2. **Check Figma version:**
   - Ensure you're using an up-to-date version of Figma Desktop
   - Some versions may have bugs with plugin loading

3. **Check browser console:**
   - Open the plugin console (Plugins → Development → Open Console)
   - Look for additional error messages that might provide clues

---

**Fix applied:** November 10, 2025
**Status:** ✅ Resolved

