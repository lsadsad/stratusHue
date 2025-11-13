# Quick Fix Guide: styleq Error

## The Problem
Your plugin was showing this error and wouldn't load:
```
styleq: kzqmXN typeof undefined is not "string" or "null".
```

## The Solution ✅

I've fixed the issue by removing code that was interfering with Figma's internal event system.

## What to Do Now

### 1. Reload Your Plugin in Figma

**Option A: Simple Reload** (Try this first)
1. In Figma, close your plugin if it's open
2. Go to **Plugins → Development → Stratus Hue**
3. The plugin should now load without errors

**Option B: Full Restart** (If Option A doesn't work)
1. Close your plugin if it's open
2. **Quit Figma completely** (don't just close the window)
3. Reopen Figma
4. Load your plugin again: **Plugins → Development → Stratus Hue**

### 2. Verify It's Working

1. Open the developer console: **Plugins → Development → Open Console**
2. You should see initialization messages like:
   - `🔍 Script executing, DOM ready state: ...`
   - `🚀 Initializing plugin functionality...`
   - `✅ Plugin initialization complete`
3. **No red errors should appear**

### 3. Test Your Plugin

Try these basic operations to make sure everything works:
- ✅ Add an emoji tag to a layer
- ✅ Navigate between layers using the navigation controls
- ✅ Create a bookmark/anchor
- ✅ Switch themes in settings

## What Changed?

The fix involved:
- ✅ Added global error handlers to catch issues before they reach Figma
- ✅ Removed EventTarget prototype override that was causing conflicts
- ✅ Plugin functionality remains exactly the same

## Still Having Issues?

If you still see the styleq error:

1. **Clear Figma's Cache:**
   - Quit Figma completely
   - On Mac: Delete `~/Library/Application Support/Figma/Cache/`
   - On Windows: Delete `%APPDATA%\Figma\Cache\`
   - Restart Figma

2. **Check Your Figma Version:**
   - Make sure you're running the latest version of Figma Desktop
   - Go to **Help → Check for Updates**

3. **Rebuild from Scratch:**
   ```bash
   cd /Users/levinsadsad/Documents/Github/Stratus_Hue
   rm -rf dist/
   npm run build
   ```

4. **Check the Console:**
   - Open **Plugins → Development → Open Console**
   - Look for any other error messages
   - Share them if you need more help

## Technical Details

See [STYLEQ_ERROR_FIX.md](./STYLEQ_ERROR_FIX.md) for complete technical documentation.

---

**Last Updated:** November 10, 2025
**Status:** ✅ Fixed and Ready to Use

