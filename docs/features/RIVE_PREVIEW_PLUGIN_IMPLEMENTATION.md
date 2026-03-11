# Rive Preview Plugin for Figma - Implementation Guide

## 🚀 **IMPLEMENTATION OVERVIEW**

This document provides a comprehensive technical implementation guide for building the Rive Preview Plugin for Figma, based on the existing stratusHue plugin framework.

---

## 🏗️ **PROJECT STRUCTURE**

### **1.1 Directory Layout**
```
rive-preview-plugin/
├── src/
│   ├── code.ts                    # Main plugin entry point
│   ├── core/
│   │   ├── types.ts              # Rive-specific type definitions
│   │   ├── constants.ts          # Plugin configuration
│   │   ├── state.ts             # State management
│   │   ├── error-handling.ts    # Error boundaries
│   │   └── rive-manager.ts       # Rive runtime management
│   ├── features/
│   │   ├── file-handler.ts      # .riv file processing
│   │   ├── animation-controller.ts # Animation playback controls
│   │   ├── property-inspector.ts  # View model property controls
│   │   └── preview-renderer.ts   # Rive animation rendering
│   ├── ui/
│   │   ├── ui-communication.ts   # Plugin ↔ UI messaging
│   │   └── ui-state.ts          # UI state management
│   ├── utils/
│   │   ├── rive-utils.ts        # Rive-specific utilities
│   │   └── validation.ts        # Data validation
│   ├── styles.css               # Plugin styling
│   └── ui.html                  # Plugin interface
├── assets/                       # Static assets
├── dist/                         # Build output
├── manifest.json                 # Plugin manifest
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── esbuild.config.js            # Build configuration
└── README.md                    # Project documentation
```

### **1.2 Build System Configuration**

#### **package.json**
```json
{
  "name": "rive-preview-plugin",
  "version": "1.0.0",
  "description": "Rive animation preview plugin for Figma",
  "main": "code.js",
  "type": "module",
  "scripts": {
    "build": "node esbuild.config.js",
    "build:prod": "cross-env NODE_ENV=production node esbuild.config.js",
    "dev": "node esbuild.config.js --watch",
    "clean": "node -e \"import fs from 'fs'; if(fs.existsSync('dist')) fs.rmSync('dist',{recursive:true,force:true}); console.log('🧹 Cleaned dist directory')\"",
    "lint": "eslint --ext .ts,.tsx --ignore-pattern node_modules .",
    "test": "vitest --run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@rive-app/canvas": "^0.9.0",
    "@rive-app/webgl": "^0.9.0"
  },
  "devDependencies": {
    "@figma/eslint-plugin-figma-plugins": "*",
    "@figma/plugin-typings": "^1.75.0",
    "@types/node": "^24.5.2",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "cross-env": "^7.0.3",
    "esbuild": "^0.19.0",
    "eslint": "^8.57.0",
    "typescript": "^5.0.0",
    "vitest": "^3.2.4"
  }
}
```

#### **esbuild.config.js**
```javascript
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

async function build() {
  try {
    // Build plugin code (runs in Figma sandbox)
    await esbuild.build({
      entryPoints: ['src/code.ts'],
      bundle: true,
      outfile: 'dist/code.js',
      platform: 'node',
      target: 'es2017',
      format: 'cjs',
      external: [],
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production'
    });

    // Build UI code (runs in browser iframe)
    await esbuild.build({
      entryPoints: ['src/ui.ts'],
      bundle: true,
      outfile: 'dist/ui.js',
      platform: 'browser',
      target: 'es2017',
      format: 'iife',
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production'
    });

    // Process HTML and inline CSS/JS
    let htmlContent = fs.readFileSync('src/ui.html', 'utf8');
    const cssContent = fs.readFileSync('src/styles.css', 'utf8');
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="styles\.css">/,
      `<style>${cssContent}</style>`
    );

    const jsContent = fs.readFileSync('dist/ui.js', 'utf8');
    htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script>\n</body>`);

    fs.writeFileSync('dist/ui.html', htmlContent);
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
```

---

## 🔧 **CORE IMPLEMENTATION**

### **2.1 Type Definitions**

#### **src/core/types.ts**
```typescript
/// <reference types="@figma/plugin-typings" />

// Rive-specific type definitions
export interface RiveFileData {
  name: string;
  size: number;
  lastModified: Date;
  artboards: ArtboardInfo[];
  stateMachines: StateMachineInfo[];
  inputs: InputInfo[];
  metadata: RiveMetadata;
}

export interface ArtboardInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  isDefault: boolean;
}

export interface StateMachineInfo {
  id: string;
  name: string;
  states: StateInfo[];
  transitions: TransitionInfo[];
  isDefault: boolean;
}

export interface StateInfo {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface TransitionInfo {
  id: string;
  name: string;
  fromState: string;
  toState: string;
  trigger?: string;
}

export interface InputInfo {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'trigger' | 'text';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface RiveMetadata {
  version: string;
  created: Date;
  modified: Date;
  author?: string;
  description?: string;
}

// Plugin state types
export interface RivePreviewState {
  currentFile: RiveFileData | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentState: string;
  currentArtboard: string;
  inputs: Record<string, any>;
  canvasSize: { width: number; height: number };
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isFullscreen: boolean;
}

// UI message types
export interface RivePreviewMessage {
  type: string;
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

export interface PropertyChangedMessage extends RivePreviewMessage {
  type: 'property-changed';
  data: {
    inputId: string;
    value: any;
  };
}
```

### **2.2 Rive Manager**

#### **src/core/rive-manager.ts**
```typescript
import { Rive, StateMachine, Artboard } from '@rive-app/canvas';

export class RiveManager {
  private riveInstance: Rive | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stateMachine: StateMachine | null = null;
  private artboard: Artboard | null = null;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;

  async loadRiveFile(fileData: ArrayBuffer): Promise<void> {
    try {
      // Initialize Rive runtime
      this.riveInstance = new Rive({
        buffer: fileData,
        canvas: this.canvas,
        autoplay: false,
        onLoad: () => {
          this.onRiveLoaded();
        },
        onLoadError: (error) => {
          this.onRiveLoadError(error);
        }
      });

      // Wait for load to complete
      await this.waitForLoad();
    } catch (error) {
      throw new Error(`Failed to load Rive file: ${error.message}`);
    }
  }

  private onRiveLoaded(): void {
    if (!this.riveInstance) return;

    // Get the first artboard
    this.artboard = this.riveInstance.artboards[0];
    
    // Get the first state machine
    this.stateMachine = this.riveInstance.stateMachines[0];

    // Set up event listeners
    this.setupEventListeners();
  }

  private onRiveLoadError(error: Error): void {
    console.error('Rive load error:', error);
    throw new Error(`Rive load failed: ${error.message}`);
  }

  private async waitForLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Rive load timeout'));
      }, 10000);

      const checkLoaded = () => {
        if (this.riveInstance && this.artboard) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };

      checkLoaded();
    });
  }

  private setupEventListeners(): void {
    if (!this.riveInstance) return;

    this.riveInstance.on('play', () => {
      this.isPlaying = true;
      this.notifyStateChange();
    });

    this.riveInstance.on('pause', () => {
      this.isPlaying = false;
      this.notifyStateChange();
    });

    this.riveInstance.on('stop', () => {
      this.isPlaying = false;
      this.notifyStateChange();
    });
  }

  play(): void {
    if (this.riveInstance && !this.isPlaying) {
      this.riveInstance.play();
    }
  }

  pause(): void {
    if (this.riveInstance && this.isPlaying) {
      this.riveInstance.pause();
    }
  }

  stop(): void {
    if (this.riveInstance) {
      this.riveInstance.stop();
    }
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(3.0, speed));
    if (this.riveInstance) {
      this.riveInstance.speed = this.playbackSpeed;
    }
  }

  setState(stateName: string): void {
    if (this.stateMachine) {
      this.stateMachine.stateChangedByName(stateName);
    }
  }

  setInput(inputName: string, value: any): void {
    if (this.stateMachine) {
      this.stateMachine.setBooleanState(inputName, value);
    }
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  private notifyStateChange(): void {
    // Notify UI of state changes
    parent.postMessage({
      pluginMessage: {
        type: 'animation-state',
        data: {
          isPlaying: this.isPlaying,
          currentTime: this.riveInstance?.time || 0,
          duration: this.riveInstance?.duration || 0,
          currentState: this.stateMachine?.stateChangedByName || ''
        }
      }
    }, '*');
  }

  destroy(): void {
    if (this.riveInstance) {
      this.riveInstance.destroy();
      this.riveInstance = null;
    }
    this.stateMachine = null;
    this.artboard = null;
    this.canvas = null;
  }
}
```

### **2.3 File Handler**

#### **src/features/file-handler.ts**
```typescript
import { RiveFileData, ArtboardInfo, StateMachineInfo, InputInfo } from '../core/types';

export class FileHandler {
  async processRiveFile(file: File): Promise<RiveFileData> {
    // Validate file
    await this.validateRiveFile(file);

    // Read file data
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse Rive metadata
    const metadata = await this.parseRiveMetadata(arrayBuffer);
    
    // Extract artboards
    const artboards = await this.extractArtboards(arrayBuffer);
    
    // Extract state machines
    const stateMachines = await this.extractStateMachines(arrayBuffer);
    
    // Extract inputs
    const inputs = await this.extractInputs(arrayBuffer);

    return {
      name: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified),
      artboards,
      stateMachines,
      inputs,
      metadata
    };
  }

  private async validateRiveFile(file: File): Promise<void> {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.riv')) {
      throw new Error('Invalid file format. Please select a .riv file.');
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 50MB.');
    }

    // Check file type
    if (file.type && !file.type.includes('application/octet-stream')) {
      throw new Error('Invalid file type.');
    }
  }

  private async parseRiveMetadata(arrayBuffer: ArrayBuffer): Promise<any> {
    // Parse Rive file header and metadata
    // This is a simplified version - actual implementation would need
    // to parse the Rive binary format
    return {
      version: '1.0.0',
      created: new Date(),
      modified: new Date(),
      author: 'Unknown',
      description: 'Rive animation file'
    };
  }

  private async extractArtboards(arrayBuffer: ArrayBuffer): Promise<ArtboardInfo[]> {
    // Extract artboard information from Rive file
    // This is a simplified version - actual implementation would need
    // to parse the Rive binary format
    return [
      {
        id: 'artboard-1',
        name: 'Main Artboard',
        width: 800,
        height: 600,
        isDefault: true
      }
    ];
  }

  private async extractStateMachines(arrayBuffer: ArrayBuffer): Promise<StateMachineInfo[]> {
    // Extract state machine information from Rive file
    // This is a simplified version - actual implementation would need
    // to parse the Rive binary format
    return [
      {
        id: 'state-machine-1',
        name: 'Main State Machine',
        states: [
          { id: 'state-1', name: 'Idle', isDefault: true },
          { id: 'state-2', name: 'Hover', isDefault: false },
          { id: 'state-3', name: 'Pressed', isDefault: false }
        ],
        transitions: [
          { id: 'trans-1', name: 'Idle to Hover', fromState: 'Idle', toState: 'Hover', trigger: 'mouseEnter' },
          { id: 'trans-2', name: 'Hover to Pressed', fromState: 'Hover', toState: 'Pressed', trigger: 'mouseDown' }
        ],
        isDefault: true
      }
    ];
  }

  private async extractInputs(arrayBuffer: ArrayBuffer): Promise<InputInfo[]> {
    // Extract input information from Rive file
    // This is a simplified version - actual implementation would need
    // to parse the Rive binary format
    return [
      {
        id: 'input-1',
        name: 'isHovered',
        type: 'boolean',
        defaultValue: false,
        description: 'Controls hover state'
      },
      {
        id: 'input-2',
        name: 'isPressed',
        type: 'boolean',
        defaultValue: false,
        description: 'Controls pressed state'
      },
      {
        id: 'input-3',
        name: 'speed',
        type: 'number',
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: 'Animation speed multiplier'
      }
    ];
  }
}
```

### **2.4 Animation Controller**

#### **src/features/animation-controller.ts**
```typescript
import { RiveManager } from '../core/rive-manager';
import { RivePreviewState } from '../core/types';

export class AnimationController {
  private riveManager: RiveManager;
  private state: RivePreviewState;

  constructor(riveManager: RiveManager, initialState: RivePreviewState) {
    this.riveManager = riveManager;
    this.state = initialState;
  }

  play(): void {
    this.riveManager.play();
    this.state.isPlaying = true;
    this.notifyStateChange();
  }

  pause(): void {
    this.riveManager.pause();
    this.state.isPlaying = false;
    this.notifyStateChange();
  }

  stop(): void {
    this.riveManager.stop();
    this.state.isPlaying = false;
    this.notifyStateChange();
  }

  setSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.1, Math.min(3.0, speed));
    this.riveManager.setSpeed(this.state.playbackSpeed);
    this.notifyStateChange();
  }

  setState(stateName: string): void {
    this.state.currentState = stateName;
    this.riveManager.setState(stateName);
    this.notifyStateChange();
  }

  setInput(inputName: string, value: any): void {
    this.state.inputs[inputName] = value;
    this.riveManager.setInput(inputName, value);
    this.notifyStateChange();
  }

  setArtboard(artboardName: string): void {
    this.state.currentArtboard = artboardName;
    // Switch artboard in Rive manager
    this.notifyStateChange();
  }

  toggleFullscreen(): void {
    this.state.isFullscreen = !this.state.isFullscreen;
    this.notifyStateChange();
  }

  setZoom(zoomLevel: number): void {
    this.state.zoomLevel = Math.max(0.1, Math.min(5.0, zoomLevel));
    this.notifyStateChange();
  }

  setPan(offset: { x: number; y: number }): void {
    this.state.panOffset = offset;
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    parent.postMessage({
      pluginMessage: {
        type: 'animation-state',
        data: {
          isPlaying: this.state.isPlaying,
          playbackSpeed: this.state.playbackSpeed,
          currentState: this.state.currentState,
          currentArtboard: this.state.currentArtboard,
          inputs: this.state.inputs,
          zoomLevel: this.state.zoomLevel,
          panOffset: this.state.panOffset,
          isFullscreen: this.state.isFullscreen
        }
      }
    }, '*');
  }
}
```

---

## 🎨 **UI IMPLEMENTATION**

### **3.1 HTML Structure**

#### **src/ui.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rive Preview Plugin</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="rive-preview-container">
    <!-- File Section -->
    <section class="file-section">
      <header class="section-header">
        <h2>📁 File</h2>
      </header>
      <div class="file-controls">
        <input type="file" id="file-input" accept=".riv" style="display: none;">
        <button id="select-file-btn" class="btn-primary">Select .riv File</button>
        <button id="clear-file-btn" class="btn-secondary" disabled>Clear</button>
      </div>
      <div id="file-info" class="file-info" style="display: none;">
        <div class="file-name"></div>
        <div class="file-size"></div>
        <div class="file-status"></div>
      </div>
    </section>

    <!-- Controls Section -->
    <section class="controls-section">
      <header class="section-header">
        <h2>🎮 Controls</h2>
      </header>
      <div class="playback-controls">
        <button id="play-btn" class="btn-control" disabled>▶️</button>
        <button id="pause-btn" class="btn-control" disabled>⏸️</button>
        <button id="stop-btn" class="btn-control" disabled>⏹️</button>
        <button id="restart-btn" class="btn-control" disabled>🔄</button>
      </div>
      <div class="speed-control">
        <label for="speed-slider">Speed:</label>
        <input type="range" id="speed-slider" min="0.1" max="3.0" step="0.1" value="1.0" disabled>
        <span id="speed-value">1.0x</span>
      </div>
      <div class="loop-control">
        <label>
          <input type="checkbox" id="loop-toggle" disabled>
          Loop
        </label>
      </div>
    </section>

    <!-- Preview Section -->
    <section class="preview-section">
      <header class="section-header">
        <h2>🖼️ Preview</h2>
        <div class="preview-controls">
          <button id="zoom-in-btn" class="btn-icon" disabled>🔍+</button>
          <button id="zoom-out-btn" class="btn-icon" disabled>🔍-</button>
          <button id="fit-screen-btn" class="btn-icon" disabled>📐</button>
          <button id="fullscreen-btn" class="btn-icon" disabled>⛶</button>
        </div>
      </header>
      <div class="preview-container">
        <canvas id="rive-canvas" width="800" height="600"></canvas>
        <div id="preview-overlay" class="preview-overlay">
          <div class="preview-placeholder">
            <div class="placeholder-icon">🎬</div>
            <div class="placeholder-text">Select a .riv file to preview</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Properties Section -->
    <section class="properties-section">
      <header class="section-header">
        <h2>⚙️ Properties</h2>
      </header>
      <div class="property-controls">
        <div class="state-control">
          <label for="state-select">State:</label>
          <select id="state-select" disabled>
            <option value="">Select State</option>
          </select>
        </div>
        <div class="artboard-control">
          <label for="artboard-select">Artboard:</label>
          <select id="artboard-select" disabled>
            <option value="">Select Artboard</option>
          </select>
        </div>
        <div id="input-controls" class="input-controls">
          <!-- Dynamic input controls will be added here -->
        </div>
      </div>
    </section>

    <!-- Export Section -->
    <section class="export-section">
      <header class="section-header">
        <h2>📤 Export</h2>
      </header>
      <div class="export-controls">
        <button id="export-gif-btn" class="btn-export" disabled>Export GIF</button>
        <button id="export-mp4-btn" class="btn-export" disabled>Export MP4</button>
        <button id="export-frames-btn" class="btn-export" disabled>Export Frames</button>
      </div>
    </section>
  </main>

  <script>
    // UI JavaScript will be inlined here by build process
  </script>
</body>
</html>
```

### **3.2 CSS Styling**

#### **src/styles.css**
```css
/* Rive Preview Plugin Styles */
:root {
  /* Rive-specific colors */
  --rive-primary: #6366f1;
  --rive-primary-hover: #4f46e5;
  --rive-primary-active: #4338ca;
  --rive-secondary: #8b5cf6;
  --rive-success: #10b981;
  --rive-warning: #f59e0b;
  --rive-error: #ef4444;
  
  /* Figma theme integration */
  --rive-bg: var(--figma-color-bg, #ffffff);
  --rive-text: var(--figma-color-text, #000000);
  --rive-border: var(--figma-color-border, #e5e7eb);
  --rive-accent: var(--figma-color-border-brand, #18a0fb);
}

.rive-preview-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--rive-bg);
  color: var(--rive-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--rive-border);
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rive-text);
}

/* Button Styles */
.btn-primary {
  background: var(--rive-primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--rive-primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  background: var(--rive-primary-active);
  transform: translateY(0);
}

.btn-primary:disabled {
  background: var(--rive-border);
  color: var(--rive-text);
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-secondary {
  background: transparent;
  color: var(--rive-text);
  border: 1px solid var(--rive-border);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--rive-border);
}

.btn-control {
  background: var(--rive-bg);
  color: var(--rive-text);
  border: 1px solid var(--rive-border);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-control:hover:not(:disabled) {
  background: var(--rive-border);
}

.btn-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  background: transparent;
  color: var(--rive-text);
  border: 1px solid var(--rive-border);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover:not(:disabled) {
  background: var(--rive-border);
}

.btn-export {
  background: var(--rive-secondary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-export:disabled {
  background: var(--rive-border);
  color: var(--rive-text);
  cursor: not-allowed;
  opacity: 0.5;
}

/* File Section */
.file-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.file-info {
  background: var(--rive-border);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 12px;
}

.file-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.file-size {
  color: var(--rive-text);
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.file-status {
  color: var(--rive-success);
  font-weight: 500;
}

/* Controls Section */
.playback-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.speed-control input[type="range"] {
  flex: 1;
  margin: 0 0.5rem;
}

.loop-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Preview Section */
.preview-container {
  position: relative;
  background: var(--rive-border);
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#rive-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rive-bg);
}

.preview-placeholder {
  text-align: center;
  color: var(--rive-text);
  opacity: 0.6;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

.placeholder-text {
  font-size: 16px;
  font-weight: 500;
}

.preview-controls {
  display: flex;
  gap: 0.25rem;
}

/* Properties Section */
.property-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.state-control,
.artboard-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.state-control select,
.artboard-control select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--rive-border);
  border-radius: 4px;
  background: var(--rive-bg);
  color: var(--rive-text);
  font-size: 14px;
}

.input-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--rive-border);
  border-radius: 4px;
}

.input-control label {
  min-width: 100px;
  font-weight: 500;
}

.input-control input,
.input-control select {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--rive-border);
  border-radius: 4px;
  background: var(--rive-bg);
  color: var(--rive-text);
  font-size: 14px;
}

.input-control input[type="range"] {
  flex: 1;
  margin: 0 0.5rem;
}

/* Export Section */
.export-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 480px) {
  .rive-preview-container {
    padding: 0.5rem;
  }
  
  .playback-controls {
    flex-wrap: wrap;
  }
  
  .export-controls {
    flex-direction: column;
  }
}

/* Accessibility */
.btn-primary:focus,
.btn-secondary:focus,
.btn-control:focus,
.btn-icon:focus,
.btn-export:focus {
  outline: 2px solid var(--rive-accent);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .btn-primary:focus,
  .btn-secondary:focus,
  .btn-control:focus,
  .btn-icon:focus,
  .btn-export:focus {
    outline: 3px solid var(--rive-accent);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn-primary,
  .btn-secondary,
  .btn-control,
  .btn-icon,
  .btn-export {
    transition: none;
  }
}
```

---

## 🔧 **BUILD AND DEPLOYMENT**

### **4.1 Development Setup**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod

# Run tests
npm test

# Lint code
npm run lint
```

### **4.2 Plugin Manifest**

#### **manifest.json**
```json
{
  "name": "Rive Preview",
  "id": "rive-preview-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma", "figjam"],
  "documentAccess": "dynamic-page"
}
```

### **4.3 Testing Strategy**

#### **Unit Tests**
```typescript
// tests/rive-manager.test.ts
import { describe, test, expect } from 'vitest';
import { RiveManager } from '../src/core/rive-manager';

describe('RiveManager', () => {
  test('should initialize correctly', () => {
    const manager = new RiveManager();
    expect(manager).toBeDefined();
  });

  test('should handle play/pause correctly', () => {
    const manager = new RiveManager();
    manager.play();
    expect(manager.isPlaying).toBe(true);
    
    manager.pause();
    expect(manager.isPlaying).toBe(false);
  });
});
```

#### **Integration Tests**
```typescript
// tests/integration.test.ts
import { describe, test, expect } from 'vitest';
import { FileHandler } from '../src/features/file-handler';

describe('File Handler Integration', () => {
  test('should process valid .riv file', async () => {
    const handler = new FileHandler();
    const mockFile = new File([''], 'test.riv', { type: 'application/octet-stream' });
    
    const result = await handler.processRiveFile(mockFile);
    expect(result.name).toBe('test.riv');
    expect(result.artboards).toBeDefined();
    expect(result.stateMachines).toBeDefined();
  });
});
```

---

## 📚 **DOCUMENTATION**

### **5.1 API Documentation**

#### **RiveManager API**
```typescript
/**
 * RiveManager - Manages Rive animation runtime
 * 
 * @example
 * const manager = new RiveManager();
 * await manager.loadRiveFile(fileData);
 * manager.play();
 */
export class RiveManager {
  /**
   * Load a Rive file from ArrayBuffer
   * @param fileData - Rive file data as ArrayBuffer
   * @throws Error if file is invalid or load fails
   */
  async loadRiveFile(fileData: ArrayBuffer): Promise<void>;
  
  /**
   * Start animation playback
   */
  play(): void;
  
  /**
   * Pause animation playback
   */
  pause(): void;
  
  /**
   * Stop animation and reset to beginning
   */
  stop(): void;
  
  /**
   * Set playback speed
   * @param speed - Speed multiplier (0.1 to 3.0)
   */
  setSpeed(speed: number): void;
  
  /**
   * Set animation state
   * @param stateName - Name of state to switch to
   */
  setState(stateName: string): void;
  
  /**
   * Set input value
   * @param inputName - Name of input to set
   * @param value - Value to set
   */
  setInput(inputName: string, value: any): void;
}
```

### **5.2 User Guide**

#### **Getting Started**
1. Install the Rive Preview plugin from Figma Community
2. Open a Figma file and run the plugin
3. Click "Select .riv File" to choose your Rive animation
4. Use the playback controls to play, pause, and control speed
5. Adjust properties in the Properties section
6. Export your animation using the Export section

#### **Features**
- **File Management**: Upload and manage .riv files
- **Playback Controls**: Play, pause, stop, and speed control
- **State Management**: Switch between animation states
- **Property Controls**: Adjust input values in real-time
- **Canvas Interaction**: Zoom, pan, and fullscreen preview
- **Export Options**: Export as GIF, MP4, or individual frames

---

This implementation guide provides a comprehensive foundation for building the Rive Preview Plugin, following the established patterns from the stratusHue plugin while adding Rive-specific functionality.