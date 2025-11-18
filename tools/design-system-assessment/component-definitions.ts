/**
 * Component Definitions - Predefined UI component definitions for stratusHue
 * 
 * This module contains the component definitions for all major UI elements
 * in the stratusHue plugin, organized by category with various states.
 */

import { ComponentDefinition, ComponentState } from './component-preview.js';

/**
 * Button component definitions
 */
export const buttonComponents: ComponentDefinition[] = [
  {
    name: 'Base Button',
    category: 'buttons',
    description: 'Base button component with standard styling',
    baseClass: 'btn-base',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: 'Button'
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: 'Button'
      },
      {
        name: 'active',
        label: 'Active',
        modifiers: ['active'],
        content: 'Button'
      },
      {
        name: 'disabled',
        label: 'Disabled',
        attributes: { disabled: 'true' },
        content: 'Button'
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `btn-base--${m}`).join(' ') : '';
      const attributes = state.attributes ? Object.entries(state.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
      return `<button class="btn-base ${modifiers}" ${attributes}>${state.content}</button>`;
    }
  },
  {
    name: 'Action Button',
    category: 'buttons',
    description: 'Action button for primary interactions',
    baseClass: 'action-btn',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: '<span class="icon">⚡</span>'
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: '<span class="icon">⚡</span>'
      },
      {
        name: 'active',
        label: 'Active',
        modifiers: ['active'],
        content: '<span class="icon">⚡</span>'
      },
      {
        name: 'disabled',
        label: 'Disabled',
        attributes: { disabled: 'true' },
        content: '<span class="icon">⚡</span>'
      },
      {
        name: 'loading',
        label: 'Loading',
        attributes: { 'data-state': 'loading' },
        content: '<span class="icon">⚡</span>'
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `action-btn--${m}`).join(' ') : '';
      const attributes = state.attributes ? Object.entries(state.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
      return `<button class="action-btn ${modifiers}" ${attributes}>${state.content}</button>`;
    }
  },
  {
    name: 'Emoji Button',
    category: 'buttons',
    description: 'Emoji button for color coding',
    baseClass: 'emoji-button',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: '🟥'
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: '🟧'
      },
      {
        name: 'active',
        label: 'Active',
        modifiers: ['active'],
        content: '🟨'
      },
      {
        name: 'selected',
        label: 'Selected',
        attributes: { 'aria-pressed': 'true' },
        content: '🟩'
      },
      {
        name: 'disabled',
        label: 'Disabled',
        attributes: { disabled: 'true' },
        content: '⬜'
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `emoji-button--${m}`).join(' ') : '';
      const attributes = state.attributes ? Object.entries(state.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
      return `<button class="emoji-button ${modifiers}" ${attributes}>${state.content}</button>`;
    }
  },
  {
    name: 'Navigation Button',
    category: 'buttons',
    description: 'Navigation button for layer traversal',
    baseClass: 'nav-button',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: '<span class="nav-icon">↑</span><span class="nav-label">Up</span>'
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: '<span class="nav-icon">↓</span><span class="nav-label">Down</span>'
      },
      {
        name: 'active',
        label: 'Active',
        modifiers: ['active'],
        content: '<span class="nav-icon">→</span><span class="nav-label">Enter</span>'
      },
      {
        name: 'disabled',
        label: 'Disabled',
        attributes: { disabled: 'true' },
        content: '<span class="nav-icon">←</span><span class="nav-label">Exit</span>'
      },
      {
        name: 'wide',
        label: 'Wide (Enter)',
        modifiers: ['wide'],
        content: '<span class="nav-icon">⏎</span><span class="nav-label">Enter Selection</span>'
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `nav-button-${m}`).join(' ') : '';
      const attributes = state.attributes ? Object.entries(state.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
      return `<button class="nav-button ${modifiers}" ${attributes}>${state.content}</button>`;
    }
  }
];

/**
 * Input component definitions
 */
export const inputComponents: ComponentDefinition[] = [
  {
    name: 'Theme Option',
    category: 'inputs',
    description: 'Radio button theme selection option',
    baseClass: 'theme-option',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: `
          <input type="radio" name="theme" value="boilerplate" id="theme-boilerplate">
          <div class="theme-option-content">
            <div class="theme-name">Boilerplate</div>
            <div class="theme-description">Pure dark theme</div>
          </div>
        `
      },
      {
        name: 'checked',
        label: 'Selected',
        content: `
          <input type="radio" name="theme" value="cybertron" id="theme-cybertron" checked>
          <div class="theme-option-content">
            <div class="theme-name">Cybertron</div>
            <div class="theme-description">Futuristic neon theme</div>
          </div>
        `
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: `
          <input type="radio" name="theme" value="figma-light" id="theme-figma-light">
          <div class="theme-option-content">
            <div class="theme-name">Figma Light</div>
            <div class="theme-description">Native Figma integration</div>
          </div>
        `
      },
      {
        name: 'focus',
        label: 'Focus',
        modifiers: ['focus'],
        content: `
          <input type="radio" name="theme" value="boilerplate" id="theme-boilerplate-focus">
          <div class="theme-option-content">
            <div class="theme-name">Boilerplate</div>
            <div class="theme-description">Pure dark theme</div>
          </div>
        `
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `theme-option--${m}`).join(' ') : '';
      return `<label class="theme-option ${modifiers}">${state.content}</label>`;
    }
  }
];

/**
 * Container component definitions
 */
export const containerComponents: ComponentDefinition[] = [
  {
    name: 'Section Header',
    category: 'containers',
    description: 'Collapsible section header with icon',
    baseClass: 'section-header',
    states: [
      {
        name: 'default',
        label: 'Default (Collapsed)',
        attributes: { 'aria-expanded': 'false' },
        content: `
          <div class="header-left">
            <div class="icon-container">
              <span class="tag-icon">🏷️</span>
              <span class="arrow"></span>
            </div>
            <div class="header-title">Tags</div>
          </div>
        `
      },
      {
        name: 'collapsed',
        label: 'Collapsed',
        attributes: { 'aria-expanded': 'false' },
        content: `
          <div class="header-left">
            <div class="icon-container">
              <span class="tag-icon">🏷️</span>
              <span class="arrow"></span>
            </div>
            <div class="header-title">Tags</div>
          </div>
        `
      },
      {
        name: 'expanded',
        label: 'Expanded',
        attributes: { 'aria-expanded': 'true' },
        content: `
          <div class="header-left">
            <div class="icon-container">
              <span class="tag-icon">🏷️</span>
              <span class="arrow"></span>
            </div>
            <div class="header-title">Tags</div>
          </div>
        `
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        attributes: { 'aria-expanded': 'false' },
        content: `
          <div class="header-left">
            <div class="icon-container">
              <span class="tag-icon">🏷️</span>
              <span class="arrow"></span>
            </div>
            <div class="header-title">Tags</div>
          </div>
        `
      },
      {
        name: 'with-subtitle',
        label: 'With Subtitle',
        attributes: { 'aria-expanded': 'false' },
        content: `
          <div class="header-left">
            <div class="icon-container">
              <span class="tag-icon">📚</span>
              <span class="arrow"></span>
            </div>
            <div class="header-title">
              Bookmarks
              <div class="header-subtitle">5 saved locations</div>
            </div>
          </div>
        `
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `section-header--${m}`).join(' ') : '';
      const attributes = state.attributes ? Object.entries(state.attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
      return `<button class="section-header ${modifiers}" ${attributes}>${state.content}</button>`;
    }
  },
  {
    name: 'Bookmark Item',
    category: 'containers',
    description: 'Individual bookmark list item',
    baseClass: 'bookmark-item',
    states: [
      {
        name: 'default',
        label: 'Default',
        content: `
          <div class="bookmark-content">
            <div class="bookmark-name">Header Component</div>
            <div class="bookmark-path">Page 1 → Frame 1 → Header</div>
          </div>
          <button class="bookmark-action" title="Go to bookmark">→</button>
        `
      },
      {
        name: 'hover',
        label: 'Hover',
        modifiers: ['hover'],
        content: `
          <div class="bookmark-content">
            <div class="bookmark-name">Navigation Menu</div>
            <div class="bookmark-path">Page 2 → Sidebar → Nav</div>
          </div>
          <button class="bookmark-action" title="Go to bookmark">→</button>
        `
      },
      {
        name: 'active',
        label: 'Active',
        modifiers: ['active'],
        content: `
          <div class="bookmark-content">
            <div class="bookmark-name">Button Group</div>
            <div class="bookmark-path">Page 1 → Components → Buttons</div>
          </div>
          <button class="bookmark-action" title="Go to bookmark">→</button>
        `
      }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `bookmark-item--${m}`).join(' ') : '';
      return `<div class="bookmark-item ${modifiers}">${state.content}</div>`;
    }
  }
];

/**
 * Navigation component definitions
 */
export const navigationComponents: ComponentDefinition[] = [
  {
    name: 'Navigation Grid',
    category: 'navigation',
    description: 'Grid layout for navigation buttons',
    baseClass: 'navigation-grid',
    states: [
      {
        name: 'default',
        label: 'Default Layout',
        content: `
          <button class="nav-button">
            <span class="nav-icon">↑</span>
            <span class="nav-label">Up</span>
          </button>
          <button class="nav-button">
            <span class="nav-icon">↓</span>
            <span class="nav-label">Down</span>
          </button>
          <button class="nav-button nav-button-wide">
            <span class="nav-icon">⏎</span>
            <span class="nav-label">Enter Selection</span>
          </button>
        `
      },
      {
        name: 'with-exit',
        label: 'With Exit Button',
        content: `
          <button class="nav-button">
            <span class="nav-icon">↑</span>
            <span class="nav-label">Up</span>
          </button>
          <button class="nav-button">
            <span class="nav-icon">↓</span>
            <span class="nav-label">Down</span>
          </button>
          <button class="nav-button">
            <span class="nav-icon">⏎</span>
            <span class="nav-label">Enter</span>
          </button>
          <button class="nav-button">
            <span class="nav-icon">←</span>
            <span class="nav-label">Exit</span>
          </button>
        `
      }
    ],
    template: (state: ComponentState) => {
      return `<div class="navigation-grid">${state.content}</div>`;
    }
  }
];

/**
 * Typography component definitions
 */
export const typographyComponents: ComponentDefinition[] = [
  {
    name: 'Text Sizes',
    category: 'typography',
    description: 'Typography scale demonstration',
    baseClass: 'text-demo',
    states: [
      {
        name: 'default',
        label: 'Font Sizes',
        content: `
          <div style="font-size: var(--font-size-xs);">Extra Small (10px)</div>
          <div style="font-size: var(--font-size-sm);">Small (11px)</div>
          <div style="font-size: var(--font-size-md);">Medium (12px)</div>
          <div style="font-size: var(--font-size-lg);">Large (14px)</div>
        `
      },
      {
        name: 'sizes',
        label: 'Font Sizes',
        content: `
          <div style="font-size: var(--font-size-xs);">Extra Small (10px)</div>
          <div style="font-size: var(--font-size-sm);">Small (11px)</div>
          <div style="font-size: var(--font-size-md);">Medium (12px)</div>
          <div style="font-size: var(--font-size-lg);">Large (14px)</div>
        `
      },
      {
        name: 'weights',
        label: 'Font Weights',
        content: `
          <div style="font-weight: var(--font-weight-light);">Light (300)</div>
          <div style="font-weight: var(--font-weight-normal);">Normal (400)</div>
          <div style="font-weight: var(--font-weight-medium);">Medium (500)</div>
          <div style="font-weight: var(--font-weight-semibold);">Semibold (600)</div>
          <div style="font-weight: var(--font-weight-bold);">Bold (700)</div>
        `
      }
    ],
    template: (state: ComponentState) => {
      return `<div class="text-demo">${state.content}</div>`;
    }
  }
];

/**
 * All component definitions combined
 */
export const allComponents: ComponentDefinition[] = [
  ...buttonComponents,
  ...inputComponents,
  ...containerComponents,
  ...navigationComponents,
  ...typographyComponents
];

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return allComponents.filter(component => component.category === category);
}

/**
 * Get component by name
 */
export function getComponentByName(name: string): ComponentDefinition | undefined {
  return allComponents.find(component => component.name === name);
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  const categories = new Set(allComponents.map(component => component.category));
  return Array.from(categories).sort();
}