# Figma Plugin Troubleshooting Guide

## Overview
This guide consolidates solutions for common technical issues when developing Figma plugins with TypeScript, esbuild, and modern tooling.

---

## 🏗️ **Build Configuration Issues**

### **Issue**: "exports is not defined" Error
**Symptoms**: Plugin fails to load with ReferenceError in browser console
**Root Cause**: TypeScript compiling to CommonJS modules in browser environment

#### **Solution: Configure ES Modules**
1. **Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "es2019",
    "lib": ["es2019", "dom"],
    "module": "es2015",              // ✅ ES modules, not CommonJS
    "types": ["@figma/plugin-typings"], // ✅ No Node.js types
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

2. **Update `manifest.json`:**
```json
{
  "main": "dist/code.js",  // ✅ Points to compiled files
  "ui": "dist/ui.html"
}
```

3. **Build Script:**
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json && copy src\\ui.html dist\\ui.html"
  }
}
```

**Verification**:
- ✅ `npm run build` completes without errors
- ✅ Compiled code uses `import`/`export` instead of `require`/`exports`
- ✅ Plugin loads successfully in Figma

---

## 📝 **TypeScript Type Loading Issues**

### **Issue**: "figma is not defined" / Unexpected Token Errors
**Symptoms**: IDE shows syntax errors, TypeScript can't find Figma API types
**Root Cause**: `@figma/plugin-typings` not loading correctly

#### **Solution: Use Triple-Slash Directives**
**Remove** global types configuration and use explicit file-level directives:

1. **Remove from `tsconfig.json`:**
```json
{
  "compilerOptions": {
    // ❌ Remove this line
    // "types": ["@figma/plugin-typings"]
  }
}
```

2. **Add to each TypeScript file using Figma APIs:**
```typescript
/// <reference types="@figma/plugin-typings" />

// Now figma, BaseNode, SceneNode, __html__ are available
figma.showUI(__html__);
```

**Why This Works Better**:
- ✅ **Explicit Loading**: Each file declares its dependencies
- ✅ **IDE Compatibility**: Works across different editors and TypeScript versions  
- ✅ **Reliable Resolution**: TypeScript consistently finds types
- ✅ **Modular Approach**: Aligns with modern TypeScript practices

**Files to Update**:
- `src/code.ts`
- `src/bookmarks.ts`
- `src/navigation.ts`
- `src/emoji-manager.ts`
- `src/validation.ts`
- `src/ui-communication.ts`
- `src/state.ts`
- `src/error-handling.ts`

---

## ⚠️ **Version Compatibility Issues**

### **Issue**: TypeScript/ESLint Version Warnings
**Symptoms**: Build warnings about unsupported TypeScript versions
**Root Cause**: Version mismatch between TypeScript and ESLint packages

#### **Solution: Align Tool Versions**
1. **Lock TypeScript Version:**
```json
{
  "devDependencies": {
    "typescript": "~5.3.3",                    // ✅ Tilde for patch-level lock
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "eslint": "^8.57.0"
  }
}
```

2. **Remove Unnecessary Dependencies:**
```json
{
  "devDependencies": {
    // ❌ Remove Node.js types (not needed for browser-based plugins)
    // "@types/node": "^18.0.0"
  }
}
```

3. **Install Aligned Versions:**
```bash
npm install --save-dev typescript@~5.3.3 @typescript-eslint/eslint-plugin@^7.18.0 @typescript-eslint/parser@^7.18.0
```

**Benefits**:
- ✅ No version compatibility warnings
- ✅ Reliable linting and type checking  
- ✅ Consistent behavior across environments
- ✅ Future-proof upgrade path

---

## 🚀 **esbuild Configuration**

### **Dual-Target Build Setup**
For plugins with separate code and UI builds:

```javascript
// esbuild.config.js
import esbuild from 'esbuild';

async function build() {
  // Plugin code (Node environment)
  await esbuild.build({
    entryPoints: ['src/code.ts'],
    bundle: true,
    outfile: 'dist/code.js',
    platform: 'node',
    target: 'es2017',
    format: 'cjs'
  });

  // UI code (Browser environment) - if using separate UI TypeScript
  if (fs.existsSync('src/ui.ts')) {
    await esbuild.build({
      entryPoints: ['src/ui.ts'],
      bundle: true,
      outfile: 'dist/ui.js',
      platform: 'browser',
      target: 'es2017',
      format: 'iife'
    });
  }
}
```

---

## 🛠️ **Common Runtime Issues**

### **Plugin Won't Load**
**Check List**:
- ✅ `manifest.json` points to correct `dist/` files
- ✅ `dist/code.js` exists and is not empty
- ✅ No syntax errors in compiled code
- ✅ All dependencies are bundled (no missing imports)

### **UI Communication Errors**
**Debug Steps**:
1. Check browser console for JavaScript errors
2. Verify message format in `figma.ui.postMessage()`
3. Ensure UI HTML includes JavaScript properly
4. Test message validation functions

### **Type Errors in Development**
**Solutions**:
- Restart TypeScript service in IDE
- Clear `dist/` folder and rebuild
- Check triple-slash directives are present
- Verify `@figma/plugin-typings` is installed

---

## 🔍 **Debugging Techniques**

### **Build Debugging**
```bash
# Clean build
rm -rf dist && npm run build

# Verbose TypeScript compilation
npx tsc --noEmit --listFiles

# Check generated code
cat dist/code.js | head -20
```

### **Runtime Debugging**
```typescript
// Add to plugin code for debugging
console.log('Plugin loaded successfully');
console.log('Available APIs:', Object.keys(figma));

// UI debugging
window.addEventListener('message', (event) => {
  console.log('Received message:', event.data);
});
```

### **Dependency Debugging**
```bash
# Check installed versions
npm ls typescript @figma/plugin-typings

# Verify TypeScript can find types
npx tsc --showConfig
```

---

## 📋 **Prevention Checklist**

### **Setup**
- [ ] Use TypeScript ~5.3.3 for stability
- [ ] Configure ES2015 modules for browser compatibility
- [ ] Add triple-slash directives to files using Figma APIs
- [ ] Exclude Node.js types from browser-based plugins

### **Development**
- [ ] Test builds frequently during development
- [ ] Use `--noEmit` for type checking without compilation
- [ ] Keep dependencies aligned with supported versions
- [ ] Clear dist folder when switching between configurations

### **Deployment**
- [ ] Test plugin loading in actual Figma environment
- [ ] Verify all features work after build process
- [ ] Check console for any runtime warnings
- [ ] Validate plugin works across different Figma versions

---

## 🆘 **Still Having Issues?**

### **Quick Diagnosis**
1. **Build fails**: Check TypeScript configuration and dependency versions
2. **Plugin won't load**: Verify manifest paths and module format
3. **Type errors**: Check triple-slash directives and type definitions
4. **Runtime errors**: Check browser console and message validation

### **Getting Help**
1. Check [Figma Plugin API documentation](https://www.figma.com/plugin-docs/)
2. Verify setup against [official TypeScript examples](https://github.com/figma/plugin-samples)
3. Test with minimal plugin to isolate issues
4. Compare working configuration with problematic setup

This troubleshooting guide consolidates solutions from real-world plugin development issues and follows Figma plugin best practices for reliable development workflows.