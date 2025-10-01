# Current Plugin Structure Analysis - Stratus Hue Framework

## 📋 **OVERVIEW**

This document analyzes the existing Stratus Hue plugin framework to provide a reference for building the Rive Preview Plugin. The current plugin demonstrates exceptional compliance with Figma plugin best practices and serves as an excellent foundation for the new Rive preview functionality.

---

## 🏗️ **ARCHITECTURE PATTERNS**

### **1.1 Modular Structure**

The current plugin follows a clean, modular architecture with clear separation of concerns:

```
src/
├── code.ts                    # Main plugin entry point
├── core/                      # Core functionality
│   ├── types.ts              # Type definitions
│   ├── constants.ts          # Configuration constants
│   ├── state.ts             # State management
│   ├── error-handling.ts    # Error boundaries
│   ├── system-theme-detector.ts # Theme detection
│   ├── theme-manager.ts     # Theme management
│   └── theme-storage.ts      # Theme persistence
├── features/                  # Feature modules
│   ├── bookmarks.ts         # Bookmark functionality
│   ├── navigation.ts        # Navigation controls
│   └── emoji-manager.ts     # Emoji management
├── ui/                        # UI communication
│   └── ui-communication.ts  # Plugin ↔ UI messaging
├── utils/                     # Utility functions
│   ├── utils.ts             # General utilities
│   └── validation.ts        # Data validation
├── styles.css                # Consolidated styles
└── ui.html                   # Plugin interface
```

### **1.2 Key Architectural Principles**

#### **Single Responsibility Principle**
- Each module has a clear, focused purpose
- Features are separated into independent modules
- Core functionality is isolated from UI concerns

#### **Dependency Injection**
- Clean import/export patterns
- Minimal coupling between modules
- Easy testing and mocking

#### **Type Safety**
- Comprehensive TypeScript coverage
- Strict type checking enabled
- Interface-driven development

---

## 🔧 **CORE IMPLEMENTATION PATTERNS**

### **2.1 State Management**

#### **Centralized State Pattern**
```typescript
// core/state.ts
export let currentAnchorState: CurrentAnchorState = { 
  bookmarkId: null, 
  timestamp: 0 
};

export async function loadAnchorState(): Promise<void> {
  const anchorData = await figma.clientStorage.getAsync('currentAnchor');
  if (anchorData) currentAnchorState = anchorData;
}

export async function saveAnchorState(): Promise<void> {
  await figma.clientStorage.setAsync('currentAnchor', currentAnchorState);
}
```

#### **State Persistence**
- Uses `figma.clientStorage` for persistent storage
- Automatic state loading on plugin initialization
- Graceful fallbacks for missing state

### **2.2 Error Handling**

#### **Error Boundary Pattern**
```typescript
// core/error-handling.ts
export function withErrorBoundary<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: ErrorType = ErrorType.UNKNOWN
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(createError(errorType, error.message, { args }));
      return null;
    }
  };
}
```

#### **Error Recovery Strategies**
- Graceful degradation for non-critical errors
- User feedback via `figma.notify()`
- Automatic cleanup and retry logic
- Structured error reporting

### **2.3 Communication Layer**

#### **Plugin ↔ UI Messaging**
```typescript
// ui/ui-communication.ts
export async function sendBookmarksToUI(): Promise<void> {
  figma.ui.postMessage({
    type: 'bookmarks',
    bookmarks,
    currentAnchorId: currentAnchorState.bookmarkId,
    isInsideAnchor: false
  });
}

export function validateMessage(msg: unknown): msg is { type: string } {
  return typeof msg === 'object' && 
         msg !== null && 
         'type' in msg && 
         typeof (msg as Record<string, unknown>).type === 'string';
}
```

#### **Message Validation**
- Type-safe message handling
- Runtime validation of message structure
- Graceful handling of invalid messages

---

## 🎨 **UI PATTERNS**

### **3.1 HTML Structure**

#### **Semantic HTML**
```html
<main class="scrollable-content">
  <nav id="quick-actions" role="toolbar" aria-label="Quick actions">
    <ul class="action-list">
      <li>
        <button id="back-btn" class="action-btn" aria-label="Go back" disabled>
          ↩<span class="label">Back</span>
        </button>
      </li>
    </ul>
  </nav>
  
  <header class="section-header collapsible" data-target="color-section" 
          role="button" tabindex="0" aria-expanded="true">
    <div class="header-left">
      <div class="icon-container">
        <i class="arrow" aria-hidden="true"></i>
        <i class="tag-icon">🏷️</i>
      </div>
      <h2 class="header-title">TAGS</h2>
    </div>
  </header>
</main>
```

#### **Accessibility Features**
- ARIA attributes for screen readers
- Semantic HTML structure
- Keyboard navigation support
- Focus management

### **3.2 CSS Architecture**

#### **CSS Custom Properties**
```css
:root {
  /* Native Figma variables with fallbacks */
  --figma-color-bg: #0f0f0f;
  --figma-color-text: #f5f5f5;
  --figma-color-border-brand: #18a0fb;
  
  /* Semantic tokens */
  --theme-bg-primary: var(--figma-color-bg, #0f0f0f);
  --theme-text-primary: var(--figma-color-text, #f5f5f5);
}
```

#### **Component-Based Styling**
- Reusable CSS classes
- Consistent design tokens
- Responsive design patterns
- Performance optimizations

### **3.3 JavaScript Patterns**

#### **Event Handling**
```typescript
// Debounced operations for performance
const debouncedSelectionUpdate = debounce(() => {
  sendSelectionStateToUI();
  detectCurrentAnchorFromSelection();
  addSelectionToHistory();
  sendNavigationStateToUI();
  triggerValidationOnSelectionChange();
}, 100);

figma.on('selectionchange', debouncedSelectionUpdate);
```

#### **Performance Optimization**
- Debounced updates to prevent spam
- Efficient DOM manipulation
- Memory cleanup strategies
- GPU acceleration for animations

---

## 🔄 **BUILD SYSTEM PATTERNS**

### **4.1 ESBuild Configuration**

#### **Dual Target Builds**
```javascript
// esbuild.config.js
await esbuild.build({
  entryPoints: ['src/code.ts'],     // Plugin code (Node)
  platform: 'node',
  target: 'es2017',
  bundle: true,
  outfile: 'dist/code.js'
});

await esbuild.build({
  entryPoints: ['src/ui.ts'],       // UI code (Browser)
  platform: 'browser', 
  target: 'es2017',
  bundle: true,
  outfile: 'dist/ui.js'
});
```

#### **Asset Inlining**
- CSS inlined into HTML
- JavaScript bundled and inlined
- Asset data URIs for images
- Lottie JSON inlining support

### **4.2 Development Workflow**

#### **Watch Mode**
```javascript
// Development with hot reload
if (process.argv.includes('--watch')) {
  const pluginContext = await esbuild.context({
    entryPoints: ['src/code.ts'],
    bundle: true,
    outfile: 'dist/code.js',
    platform: 'node',
    target: 'es2017',
    format: 'cjs',
    sourcemap: true
  });
  await pluginContext.watch();
}
```

#### **Production Optimization**
- Minification for production builds
- Source maps for debugging
- Tree shaking for dead code elimination
- Bundle size optimization

---

## 🧪 **TESTING PATTERNS**

### **5.1 Test Structure**

#### **Unit Tests**
```typescript
// test/navigation.test.ts
describe('Navigation', () => {
  test('should navigate to next sibling', () => {
    const result = navigateToSibling(mockNode, 'next');
    expect(result.success).toBe(true);
    expect(result.newSelection).toBeDefined();
  });
});
```

#### **Integration Tests**
```typescript
// test/navigation-integration.test.ts
describe('Navigation Integration', () => {
  test('should handle complex navigation scenarios', async () => {
    // Test complete navigation workflows
  });
});
```

### **5.2 Performance Testing**

#### **Performance Baselines**
```typescript
// test/performance.test.ts
describe('Performance', () => {
  test('should meet performance baselines', () => {
    const start = performance.now();
    // Execute operation
    const end = performance.now();
    expect(end - start).toBeLessThan(100); // 100ms baseline
  });
});
```

---

## 📊 **PERFORMANCE PATTERNS**

### **6.1 Memory Management**

#### **Cache Management**
```typescript
// utils.ts
export function clearBookmarksCache(): void {
  bookmarksCache = null;
}

export function clearNavigationContextCache(): void {
  navigationContextCache = null;
}
```

#### **Debounced Operations**
```typescript
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T, 
  wait = 100
) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
```

### **6.2 Rendering Optimization**

#### **CSS Performance**
```css
/* GPU acceleration for animations */
.emoji-button,
.action-btn,
.bookmark-item {
  will-change: transform;
  contain: layout style paint;
}

/* Efficient scrolling */
.scrollable-content {
  will-change: scroll-position;
  contain: layout style paint;
}
```

#### **DOM Optimization**
- DocumentFragment for batch updates
- Efficient event delegation
- Minimal DOM queries
- Proper cleanup of listeners

---

## 🔒 **SECURITY PATTERNS**

### **7.1 Input Validation**

#### **Type Guards**
```typescript
export function validateMessage(msg: unknown): msg is { type: string } {
  return typeof msg === 'object' && 
         msg !== null && 
         'type' in msg && 
         typeof (msg as Record<string, unknown>).type === 'string';
}

export function validateSceneNode(node: BaseNode | null): node is SceneNode {
  return validateNodeExists(node) && 'name' in node;
}
```

#### **Data Sanitization**
- Input validation for all user inputs
- Type checking for external data
- Boundary checking for numeric inputs
- Safe defaults for invalid data

### **7.2 Storage Security**

#### **Safe Storage Operations**
```typescript
export async function setBookmarks(bookmarks: Bookmark[]): Promise<void> {
  try {
    figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks));
    bookmarksCache = bookmarks;
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
}
```

#### **Error Boundaries**
- Safe storage operations with error handling
- Graceful degradation for storage failures
- Data validation before persistence
- Version compatibility handling

---

## 🎯 **APPLICATION TO RIVE PLUGIN**

### **8.1 Reusable Patterns**

#### **State Management**
- Use centralized state pattern for Rive file data
- Implement persistent storage for user preferences
- Add state validation for Rive-specific data

#### **Error Handling**
- Apply error boundary pattern to Rive operations
- Add Rive-specific error types and recovery strategies
- Implement graceful degradation for unsupported features

#### **Communication**
- Extend messaging system for Rive-specific messages
- Add validation for Rive file data
- Implement real-time property updates

### **8.2 Rive-Specific Adaptations**

#### **File Handling**
- Extend file validation for .riv files
- Add Rive file parsing and metadata extraction
- Implement progress indicators for large files

#### **Animation Controls**
- Add playback control patterns
- Implement speed and loop controls
- Add frame navigation functionality

#### **Property Inspector**
- Create dynamic input controls based on Rive inputs
- Implement real-time property updates
- Add state machine controls

### **8.3 Performance Considerations**

#### **Rive Runtime Integration**
- Lazy load Rive runtime only when needed
- Implement proper cleanup of Rive instances
- Add memory monitoring for large animations

#### **Canvas Rendering**
- Optimize canvas rendering performance
- Implement efficient zoom and pan controls
- Add fullscreen mode with proper cleanup

---

## 📚 **BEST PRACTICES SUMMARY**

### **9.1 Architecture**
- ✅ Modular design with clear separation of concerns
- ✅ Type-safe development with comprehensive interfaces
- ✅ Error boundaries with graceful degradation
- ✅ Centralized state management with persistence

### **9.2 Performance**
- ✅ Debounced operations to prevent spam
- ✅ GPU acceleration for smooth animations
- ✅ Memory management with proper cleanup
- ✅ Efficient DOM manipulation

### **9.3 Accessibility**
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ High contrast mode support

### **9.4 Security**
- ✅ Input validation and sanitization
- ✅ Safe storage operations
- ✅ Type guards for external data
- ✅ Error boundaries for all operations

---

## 🚀 **IMPLEMENTATION RECOMMENDATIONS**

### **10.1 For Rive Plugin Development**

1. **Follow Established Patterns**: Use the same architectural patterns as Stratus Hue
2. **Extend Type System**: Add Rive-specific types while maintaining compatibility
3. **Implement Error Boundaries**: Apply error handling patterns to Rive operations
4. **Optimize Performance**: Use debouncing and caching patterns for Rive operations
5. **Maintain Accessibility**: Ensure all Rive controls are accessible

### **10.2 Key Adaptations Needed**

1. **Rive Runtime Integration**: Add Rive-specific runtime management
2. **File Processing**: Implement .riv file parsing and validation
3. **Animation Controls**: Add playback and property control patterns
4. **Canvas Rendering**: Implement efficient Rive animation rendering
5. **Export Functionality**: Add export capabilities for different formats

---

This analysis provides a comprehensive reference for building the Rive Preview Plugin using the proven patterns and best practices established in the Stratus Hue plugin framework.