# Rive Preview Plugin for Figma - Design Document

## 🎯 **PROJECT OVERVIEW**

### **Plugin Name**: Rive Preview
### **Purpose**: Enable designers to preview, test, and interact with Rive (.riv) animations directly within Figma
### **Target Users**: Designers, animators, and developers working with interactive animations

---

## 🏗️ **ARCHITECTURE DESIGN**

### **1. Plugin Structure Overview**

Based on the existing stratusHue plugin framework, the Rive Preview plugin will follow a similar modular architecture:

```
src/
├── code.ts                    # Main plugin entry point
├── core/
│   ├── types.ts              # Rive-specific type definitions
│   ├── constants.ts          # Plugin configuration
│   ├── state.ts             # State management
│   ├── error-handling.ts    # Error boundaries
│   └── rive-manager.ts       # Rive runtime management
├── features/
│   ├── file-handler.ts      # .riv file processing
│   ├── animation-controller.ts # Animation playback controls
│   ├── property-inspector.ts  # View model property controls
│   └── preview-renderer.ts   # Rive animation rendering
├── ui/
│   ├── ui-communication.ts   # Plugin ↔ UI messaging
│   └── ui-state.ts          # UI state management
├── utils/
│   ├── rive-utils.ts        # Rive-specific utilities
│   └── validation.ts        # Data validation
├── styles.css               # Plugin styling
└── ui.html                  # Plugin interface
```

### **2. Core Architecture Principles**

- **Modular Design**: Clear separation of concerns following existing patterns
- **Type Safety**: Comprehensive TypeScript coverage with Rive-specific types
- **Error Boundaries**: Robust error handling for Rive runtime failures
- **Performance**: Optimized rendering and memory management
- **Accessibility**: WCAG 2.1 AA compliance for all UI elements

---

## 🎨 **USER INTERFACE DESIGN**

### **1. Main Interface Layout**

```
┌─────────────────────────────────────────┐
│  🎬 Rive Preview                        │
├─────────────────────────────────────────┤
│  📁 File Section                        │
│  ┌─────────────────────────────────────┐ │
│  │ [Select .riv File] [Load] [Clear]   │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  🎮 Controls Section                    │
│  ┌─────────────────────────────────────┐ │
│  │ [▶️] [⏸️] [⏹️] [🔄] Speed: [1.0x] │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  🖼️ Preview Section                     │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  │        Rive Animation               │ │
│  │        (Interactive Canvas)         │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  ⚙️ Properties Section                  │
│  ┌─────────────────────────────────────┐ │
│  │ State Machine: [Dropdown]           │ │
│  │ Inputs: [Slider] [Toggle] [Input]   │ │
│  │ Artboards: [Dropdown]               │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **2. UI Components Design**

#### **File Management Section**
- **File Input**: Drag-and-drop or click-to-select .riv files
- **File Info**: Display file name, size, and last modified date
- **Load Status**: Progress indicator and error messages
- **Recent Files**: Quick access to recently opened files

#### **Animation Controls**
- **Playback Controls**: Play, pause, stop, restart buttons
- **Speed Control**: Slider for playback speed (0.1x - 3.0x)
- **Loop Toggle**: Enable/disable animation looping
- **Frame Controls**: Step forward/backward frame by frame

#### **Preview Canvas**
- **Interactive Canvas**: Rive animation rendering area
- **Zoom Controls**: Fit to screen, zoom in/out, pan
- **Fullscreen Toggle**: Expand preview to full size
- **Performance Info**: FPS counter and memory usage

#### **Property Inspector**
- **State Machine**: Dropdown to select animation states
- **Input Controls**: Dynamic controls based on Rive file inputs
- **Artboard Selection**: Switch between different artboards
- **Export Options**: Export as GIF, MP4, or static frames

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **1. Rive Integration**

#### **Runtime Dependencies**
```json
{
  "dependencies": {
    "@rive-app/canvas": "^0.9.0",
    "@rive-app/webgl": "^0.9.0"
  }
}
```

#### **Rive Manager Implementation**
```typescript
// core/rive-manager.ts
export class RiveManager {
  private riveInstance: Rive | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stateMachine: StateMachine | null = null;
  
  async loadRiveFile(fileData: ArrayBuffer): Promise<void> {
    // Initialize Rive runtime
    // Load .riv file data
    // Set up canvas rendering
  }
  
  play(): void {
    // Start animation playback
  }
  
  pause(): void {
    // Pause animation
  }
  
  setSpeed(speed: number): void {
    // Adjust playback speed
  }
  
  setState(stateName: string): void {
    // Change animation state
  }
  
  setInput(inputName: string, value: any): void {
    // Update input values
  }
}
```

### **2. File Handling**

#### **Supported File Types**
- **Primary**: .riv files (Rive binary format)
- **Fallback**: .json files (Rive JSON export)
- **Size Limit**: 50MB maximum file size
- **Validation**: Rive file format validation

#### **File Processing Pipeline**
```typescript
// features/file-handler.ts
export class FileHandler {
  async processRiveFile(file: File): Promise<RiveFileData> {
    // 1. Validate file type and size
    // 2. Read file data
    // 3. Parse Rive metadata
    // 4. Extract state machine info
    // 5. Return structured data
  }
  
  async validateRiveFile(data: ArrayBuffer): Promise<boolean> {
    // Check Rive file header
    // Validate file structure
    // Return validation result
  }
}
```

### **3. State Management**

#### **Plugin State Structure**
```typescript
// core/types.ts
export interface RivePreviewState {
  currentFile: RiveFileData | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentState: string;
  inputs: Record<string, any>;
  canvasSize: { width: number; height: number };
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

export interface RiveFileData {
  name: string;
  size: number;
  lastModified: Date;
  artboards: ArtboardInfo[];
  stateMachines: StateMachineInfo[];
  inputs: InputInfo[];
  metadata: RiveMetadata;
}
```

### **4. Communication Layer**

#### **Plugin ↔ UI Message Types**
```typescript
// ui/ui-communication.ts
export interface RivePreviewMessage {
  type: 'file-loaded' | 'animation-state' | 'property-changed' | 'error';
  data: any;
}

export interface FileLoadedMessage extends RivePreviewMessage {
  type: 'file-loaded';
  data: {
    file: RiveFileData;
    canvasSize: { width: number; height: number };
  };
}

export interface AnimationStateMessage extends RivePreviewMessage {
  type: 'animation-state';
  data: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    currentState: string;
  };
}
```

---

## 🎮 **INTERACTION DESIGN**

### **1. Animation Controls**

#### **Playback Controls**
- **Play/Pause Toggle**: Single button that toggles playback state
- **Stop Button**: Reset animation to beginning
- **Restart Button**: Restart from beginning
- **Speed Slider**: 0.1x to 3.0x with 0.1x increments
- **Loop Toggle**: Enable/disable infinite looping

#### **Frame Navigation**
- **Frame Step**: Move one frame forward/backward
- **Frame Jump**: Jump to specific frame number
- **Timeline Scrubber**: Visual timeline with draggable scrubber
- **Keyframe Navigation**: Jump to next/previous keyframe

### **2. Property Inspector**

#### **State Machine Controls**
- **State Dropdown**: Select from available animation states
- **State Preview**: Visual preview of selected state
- **State Transitions**: Show available transitions

#### **Input Controls**
- **Boolean Inputs**: Toggle switches
- **Number Inputs**: Sliders with min/max values
- **Trigger Inputs**: Buttons to fire triggers
- **Text Inputs**: Text fields for string inputs

#### **Artboard Management**
- **Artboard Dropdown**: Switch between artboards
- **Artboard Info**: Display artboard dimensions and properties
- **Artboard Preview**: Thumbnail preview of artboards

### **3. Canvas Interactions**

#### **View Controls**
- **Zoom**: Mouse wheel or zoom controls (10% - 500%)
- **Pan**: Click and drag to pan around canvas
- **Fit to Screen**: Auto-fit animation to canvas size
- **Reset View**: Return to default zoom and position

#### **Animation Interaction**
- **Click Events**: Handle clicks on interactive elements
- **Hover States**: Show hover effects for interactive elements
- **Input Focus**: Handle keyboard input for text inputs
- **Touch Support**: Support for touch interactions

---

## 🎨 **VISUAL DESIGN SYSTEM**

### **1. Color Palette**

```css
:root {
  /* Primary Colors */
  --rive-primary: #6366f1;
  --rive-primary-hover: #4f46e5;
  --rive-primary-active: #4338ca;
  
  /* Secondary Colors */
  --rive-secondary: #8b5cf6;
  --rive-secondary-hover: #7c3aed;
  
  /* Status Colors */
  --rive-success: #10b981;
  --rive-warning: #f59e0b;
  --rive-error: #ef4444;
  
  /* Neutral Colors */
  --rive-gray-50: #f9fafb;
  --rive-gray-100: #f3f4f6;
  --rive-gray-200: #e5e7eb;
  --rive-gray-300: #d1d5db;
  --rive-gray-400: #9ca3af;
  --rive-gray-500: #6b7280;
  --rive-gray-600: #4b5563;
  --rive-gray-700: #374151;
  --rive-gray-800: #1f2937;
  --rive-gray-900: #111827;
}
```

### **2. Typography**

```css
/* Font Stack */
--rive-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--rive-font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;

/* Font Sizes */
--rive-text-xs: 0.75rem;    /* 12px */
--rive-text-sm: 0.875rem;   /* 14px */
--rive-text-base: 1rem;     /* 16px */
--rive-text-lg: 1.125rem;   /* 18px */
--rive-text-xl: 1.25rem;    /* 20px */
--rive-text-2xl: 1.5rem;    /* 24px */
```

### **3. Component Styles**

#### **Button Components**
```css
.rive-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: var(--rive-primary);
  color: white;
}

.rive-btn:hover {
  background: var(--rive-primary-hover);
  transform: translateY(-1px);
}

.rive-btn:active {
  background: var(--rive-primary-active);
  transform: translateY(0);
}
```

#### **Control Panel**
```css
.rive-control-panel {
  background: var(--figma-color-bg, #ffffff);
  border: 1px solid var(--figma-color-border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.rive-control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.rive-control-group:last-child {
  margin-bottom: 0;
}
```

---

## 📱 **RESPONSIVE DESIGN**

### **1. Breakpoints**

```css
/* Mobile First Approach */
@media (max-width: 320px) {
  /* Extra small devices */
  .rive-preview-container {
    padding: 0.5rem;
  }
}

@media (min-width: 321px) and (max-width: 480px) {
  /* Small devices */
  .rive-preview-container {
    padding: 0.75rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  /* Medium devices */
  .rive-preview-container {
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  /* Large devices */
  .rive-preview-container {
    padding: 1.5rem;
  }
}
```

### **2. Adaptive Layout**

- **Collapsible Sections**: Allow users to collapse/expand sections
- **Resizable Panels**: Drag to resize preview canvas and controls
- **Fullscreen Mode**: Expand preview to full window size
- **Mobile Optimization**: Touch-friendly controls for mobile devices

---

## 🔒 **SECURITY & PERFORMANCE**

### **1. Security Considerations**

- **File Validation**: Strict validation of .riv file format
- **Sandboxed Execution**: Rive runtime runs in isolated context
- **Memory Limits**: Enforce memory usage limits for large files
- **Input Sanitization**: Sanitize all user inputs and file data

### **2. Performance Optimization**

- **Lazy Loading**: Load Rive runtime only when needed
- **Memory Management**: Proper cleanup of Rive instances
- **Frame Rate Control**: Adaptive frame rate based on complexity
- **Resource Monitoring**: Monitor memory and CPU usage

### **3. Error Handling**

- **Graceful Degradation**: Fallback for unsupported features
- **User Feedback**: Clear error messages and recovery options
- **Logging**: Comprehensive error logging for debugging
- **Recovery**: Automatic recovery from common errors

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Core Foundation**
- [ ] Set up plugin structure and build system
- [ ] Implement basic Rive runtime integration
- [ ] Create file upload and validation
- [ ] Basic animation playback controls

### **Phase 2: Interactive Features**
- [ ] Property inspector for state machines
- [ ] Input controls for Rive inputs
- [ ] Canvas interaction (zoom, pan, click)
- [ ] Artboard switching

### **Phase 3: Advanced Features**
- [ ] Export functionality (GIF, MP4, frames)
- [ ] Performance optimization
- [ ] Advanced animation controls
- [ ] Fullscreen mode

### **Phase 4: Polish & Testing**
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Documentation and examples

---

## 📋 **SUCCESS CRITERIA**

### **Functional Requirements**
- ✅ Load and display .riv files up to 50MB
- ✅ Play, pause, stop, and control playback speed
- ✅ Switch between animation states and artboards
- ✅ Modify input values and see real-time changes
- ✅ Export animations in multiple formats
- ✅ Responsive design for different screen sizes

### **Performance Requirements**
- ✅ Load files under 2 seconds
- ✅ Maintain 60fps during playback
- ✅ Memory usage under 100MB for typical files
- ✅ Support files up to 50MB without performance degradation

### **User Experience Requirements**
- ✅ Intuitive interface following Figma design patterns
- ✅ Accessible to users with disabilities
- ✅ Clear error messages and recovery options
- ✅ Smooth interactions and animations

---

This design document provides a comprehensive blueprint for building a Rive preview plugin that integrates seamlessly with Figma's ecosystem while providing powerful animation preview and testing capabilities.