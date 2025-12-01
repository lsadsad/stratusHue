# Naming Taxonomy - Design Document

## AI Context Summary

> **For AI Assistants**: This document provides the technical design for implementing the Unified Naming Taxonomy in the Stratus Hue plugin. It covers data structures, algorithms, integration points, and implementation strategies. When implementing naming-related features, use these patterns and integrate with the existing plugin architecture.

---

## Overview

The Naming Taxonomy system provides automated, rule-based labeling and naming conventions across four domains. This design document specifies how to implement the taxonomy within the existing Stratus Hue plugin architecture.

### Design Principles

1. **Non-destructive**: Preserve user intent; auto-labeling enhances, doesn't replace
2. **Progressive**: Simple names are valid; complexity is optional
3. **Reversible**: Any auto-applied label can be removed or modified
4. **Performant**: Validation runs in <10ms per name
5. **Extensible**: New rules can be added via configuration

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAMING TAXONOMY SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐ │
│  │    SCHEMA    │   │    RULES     │   │       TRANSFORMS         │ │
│  │   REGISTRY   │   │    ENGINE    │   │                          │ │
│  ├──────────────┤   ├──────────────┤   ├──────────────────────────┤ │
│  │ • Patterns   │   │ • Matchers   │   │ • Format converters      │ │
│  │ • Tokens     │   │ • Validators │   │ • Case transformers      │ │
│  │ • Separators │   │ • Suggesters │   │ • Token extractors       │ │
│  │ • Defaults   │   │ • Appliers   │   │ • Name composers         │ │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘ │
│         │                   │                       │                │
│         └───────────────────┼───────────────────────┘                │
│                             │                                        │
│                    ┌────────▼────────┐                               │
│                    │   INTEGRATION   │                               │
│                    │      LAYER      │                               │
│                    ├─────────────────┤                               │
│                    │ • Plugin hooks  │                               │
│                    │ • UI components │                               │
│                    │ • Message types │                               │
│                    └─────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── core/
│   └── naming/
│       ├── index.ts           # Public API exports
│       ├── schema.ts          # Token and pattern definitions
│       ├── rules.ts           # Rule engine and matchers
│       ├── transforms.ts      # Name transformation utilities
│       ├── validators.ts      # Validation functions
│       └── types.ts           # TypeScript type definitions
├── features/
│   └── auto-labeling.ts       # Plugin feature integration
└── ui/
    └── components/
        └── naming-panel.ts    # UI for naming tools (future)
```

---

## Data Models

### Core Types

```typescript
// src/core/naming/types.ts

/**
 * Domains where naming conventions apply
 */
export type NamingDomain = 'design' | 'dev' | 'business' | 'delivery';

/**
 * Element types within the Design domain
 */
export type DesignElementType = 
  | 'page' 
  | 'section' 
  | 'frame' 
  | 'layer' 
  | 'component' 
  | 'instance';

/**
 * A single token within a structured name
 */
export interface NameToken {
  type: 'prefix' | 'category' | 'type' | 'name' | 'modifier' | 'status' | 'version' | 'date';
  value: string;
  position: number;
  raw: string;  // Original text before normalization
}

/**
 * A parsed, structured name broken into tokens
 */
export interface ParsedName {
  original: string;
  domain: NamingDomain;
  elementType?: DesignElementType;
  tokens: NameToken[];
  isValid: boolean;
  errors: ValidationError[];
  suggestions: string[];
}

/**
 * Configuration for a naming rule
 */
export interface NamingRule {
  id: string;
  name: string;
  domain: NamingDomain;
  elementType?: DesignElementType | DesignElementType[];
  priority: number;  // Lower = higher priority
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
}

/**
 * Condition that determines when a rule applies
 */
export interface RuleCondition {
  type: 'node-type' | 'name-pattern' | 'property' | 'hierarchy' | 'composite';
  // For node-type conditions
  nodeTypes?: string[];
  // For name-pattern conditions
  pattern?: RegExp;
  // For property conditions
  property?: string;
  propertyValue?: unknown;
  // For hierarchy conditions
  parentPattern?: RegExp;
  depth?: number;
  // For composite conditions
  operator?: 'AND' | 'OR' | 'NOT';
  conditions?: RuleCondition[];
}

/**
 * Action to perform when a rule matches
 */
export interface RuleAction {
  type: 'prefix' | 'suffix' | 'replace' | 'template' | 'transform';
  // For prefix/suffix actions
  value?: string | ((node: SceneNode) => string);
  // For replace actions
  pattern?: RegExp;
  replacement?: string;
  // For template actions
  template?: string;  // e.g., "{type}.{name}.{state}"
  // For transform actions
  transform?: 'kebab-case' | 'camelCase' | 'PascalCase' | 'UPPER_CASE' | 'lower_case';
}

/**
 * Result of validating a name
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  parsedName: ParsedName;
}

/**
 * A validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  token?: NameToken;
  suggestion?: string;
}

/**
 * A validation warning (non-blocking)
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

/**
 * User-configurable naming preferences
 */
export interface NamingPreferences {
  enabled: boolean;
  autoApplyOnCreate: boolean;
  showValidationWarnings: boolean;
  customRules: NamingRule[];
  domainDefaults: Record<NamingDomain, Partial<NamingRule>>;
}
```

### Schema Definitions

```typescript
// src/core/naming/schema.ts

import type { NamingDomain, DesignElementType } from './types';

/**
 * Token separator characters
 */
export const SEPARATORS = {
  hierarchy: '.',      // Between hierarchy levels
  compound: '-',       // Within compound words
  variant: '_',        // For variant indicators
  path: '/',           // For file paths
  action: ':',         // For action/domain separation
  space: ' ',          // For readable names
} as const;

/**
 * Reserved prefixes by domain
 */
export const RESERVED_PREFIXES: Record<NamingDomain, string[]> = {
  design: ['↳', '[', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🚧', '✅', '👀', '🚀', '🚫', '🪦', '⭐', '📱'],
  dev: ['handle', 'on', 'get', 'set', 'is', 'has', 'can', 'should'],
  business: ['STRAT', 'FEAT', 'BUG', 'EPIC', 'TASK', 'SPIKE'],
  delivery: ['icons', 'images', 'assets', 'exports'],
};

/**
 * Pattern templates by element type
 */
export const PATTERN_TEMPLATES: Record<DesignElementType, string> = {
  page: '↳ {emoji?} {date?} : {title}',
  section: '[{category}] {title}',
  frame: '{breakpoint}.{component}.{state?}',
  layer: '{block}.{element?}.{modifier?}',
  component: '{name}/{property}={value}',
  instance: '{componentName}',
};

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  // Design domain
  pageTitle: /^↳\s*([🔴🟠🟡🟢🔵🟣⚫️⚪️🚧✅👀🚀🚫🪦⭐📱🏷️📌🎯💡🔥💎🎨🟥🟧🟨🟩🟦🟪⬛⬜])?\s*(\d{2}\.\d{2})?\s*:?\s*(.+)$/,
  sectionHeader: /^\[([A-Z][A-Z0-9_]*)\]\s*(.+)$/,
  frameName: /^([A-Z][a-z]+)(\.([A-Z][a-zA-Z0-9]+))*(\.([A-Z][a-z]+))?$/,
  layerBEM: /^([a-z][a-z0-9]*)(\.([a-z][a-z0-9]*))*(\.([a-z][a-z0-9-]*))?$/,
  componentVariant: /^([A-Z][a-zA-Z0-9]+)(\/([A-Z][a-zA-Z0-9]+)=([a-zA-Z0-9]+))+$/,
  
  // Development domain  
  messageType: /^([a-z]+):([a-z]+):([a-z][a-z0-9-]*)$/,
  handlerName: /^handle([A-Z][a-zA-Z0-9]*)$/,
  stateName: /^([a-z]+)([A-Z][a-zA-Z0-9]*)?(State|Data|Config|Cache)?$/,
  eventName: /^on([A-Z][a-zA-Z0-9]*)$/,
  
  // Business domain
  ticketId: /^([A-Z]{2,6})-([A-Z]{2,6})-(\d{1,6})$/,
  featureSlug: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
  epicSlug: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
  
  // Delivery domain
  assetPath: /^([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)\/([a-z][a-z0-9-]*)(\.([a-z0-9]+))?(\.(\d+x|\d+))?\.(svg|png|jpg|jpeg|webp|gif|pdf)$/i,
  fileName: /^[a-z][a-z0-9-]*(\.[a-z0-9]+)*$/,
};

/**
 * Default breakpoint names for frames
 */
export const BREAKPOINT_NAMES = ['Mobile', 'Tablet', 'Desktop', 'Wide'] as const;

/**
 * Default state names for UI elements
 */
export const STATE_NAMES = ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading', 'Error', 'Success'] as const;

/**
 * Common category names for sections
 */
export const SECTION_CATEGORIES = [
  'COMPONENTS',
  'PATTERNS', 
  'TEMPLATES',
  'TOKENS',
  'ICONS',
  'ILLUSTRATIONS',
  'LAYOUTS',
  'PAGES',
  'ARCHIVE',
  'WIP',
  'REVIEW',
  'APPROVED',
] as const;
```

---

## Rule Engine

### Rule Matching

```typescript
// src/core/naming/rules.ts

import type { NamingRule, RuleCondition, SceneNode } from './types';

/**
 * Evaluate if a rule condition matches a node
 */
export function evaluateCondition(
  condition: RuleCondition, 
  node: SceneNode,
  context: RuleContext
): boolean {
  switch (condition.type) {
    case 'node-type':
      return condition.nodeTypes?.includes(node.type) ?? false;
      
    case 'name-pattern':
      return condition.pattern?.test(node.name) ?? false;
      
    case 'property':
      if (!condition.property) return false;
      const value = (node as any)[condition.property];
      return condition.propertyValue !== undefined 
        ? value === condition.propertyValue 
        : value !== undefined;
        
    case 'hierarchy':
      return evaluateHierarchyCondition(condition, node, context);
      
    case 'composite':
      return evaluateCompositeCondition(condition, node, context);
      
    default:
      return false;
  }
}

/**
 * Find all matching rules for a node, sorted by priority
 */
export function findMatchingRules(
  node: SceneNode,
  rules: NamingRule[],
  context: RuleContext
): NamingRule[] {
  return rules
    .filter(rule => rule.enabled)
    .filter(rule => evaluateCondition(rule.condition, node, context))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Apply a rule action to generate a new name
 */
export function applyRuleAction(
  node: SceneNode,
  rule: NamingRule,
  currentName: string
): string {
  const action = rule.action;
  
  switch (action.type) {
    case 'prefix': {
      const prefix = typeof action.value === 'function' 
        ? action.value(node) 
        : action.value;
      return `${prefix}${currentName}`;
    }
    
    case 'suffix': {
      const suffix = typeof action.value === 'function'
        ? action.value(node)
        : action.value;
      return `${currentName}${suffix}`;
    }
    
    case 'replace': {
      if (!action.pattern || action.replacement === undefined) return currentName;
      return currentName.replace(action.pattern, action.replacement);
    }
    
    case 'template': {
      return applyTemplate(action.template ?? '', node, currentName);
    }
    
    case 'transform': {
      return applyTransform(currentName, action.transform ?? 'kebab-case');
    }
    
    default:
      return currentName;
  }
}

/**
 * Context passed to rule evaluation
 */
export interface RuleContext {
  page: PageNode;
  depth: number;
  siblingIndex: number;
  siblingCount: number;
  parentName?: string;
  selection: readonly SceneNode[];
}
```

### Default Rules

```typescript
// src/core/naming/default-rules.ts

import type { NamingRule } from './types';

/**
 * Built-in rules for the Design domain
 */
export const DEFAULT_DESIGN_RULES: NamingRule[] = [
  // Rule: Auto-prefix frames by type
  {
    id: 'frame-type-prefix',
    name: 'Frame Type Prefix',
    domain: 'design',
    elementType: 'frame',
    priority: 100,
    enabled: true,
    condition: {
      type: 'node-type',
      nodeTypes: ['FRAME'],
    },
    action: {
      type: 'template',
      template: '{breakpoint}.{name}',
    },
  },
  
  // Rule: Auto-label by node type
  {
    id: 'type-emoji-prefix',
    name: 'Type Emoji Prefix',
    domain: 'design',
    elementType: 'layer',
    priority: 200,
    enabled: false, // Opt-in
    condition: {
      type: 'node-type',
      nodeTypes: ['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'TEXT', 'VECTOR'],
    },
    action: {
      type: 'prefix',
      value: (node) => {
        const typeEmojis: Record<string, string> = {
          'FRAME': '🖼️ ',
          'GROUP': '📁 ',
          'COMPONENT': '🧩 ',
          'INSTANCE': '🔗 ',
          'TEXT': '📝 ',
          'VECTOR': '✏️ ',
        };
        return typeEmojis[node.type] || '';
      },
    },
  },
  
  // Rule: Section header formatting
  {
    id: 'section-header-format',
    name: 'Section Header Format',
    domain: 'design',
    elementType: 'section',
    priority: 50,
    enabled: true,
    condition: {
      type: 'node-type',
      nodeTypes: ['SECTION'],
    },
    action: {
      type: 'template',
      template: '[{category}] {title}',
    },
  },
  
  // Rule: BEM-style layer naming
  {
    id: 'layer-bem-format',
    name: 'BEM Layer Naming',
    domain: 'design',
    elementType: 'layer',
    priority: 300,
    enabled: false, // Opt-in
    condition: {
      type: 'composite',
      operator: 'AND',
      conditions: [
        { type: 'node-type', nodeTypes: ['FRAME', 'GROUP', 'RECTANGLE', 'ELLIPSE'] },
        { type: 'hierarchy', depth: 2 }, // At least 2 levels deep
      ],
    },
    action: {
      type: 'template',
      template: '{parent}.{name}',
    },
  },
  
  // Rule: Auto-detect breakpoint from width
  {
    id: 'breakpoint-from-width',
    name: 'Auto-detect Breakpoint',
    domain: 'design',
    elementType: 'frame',
    priority: 150,
    enabled: true,
    condition: {
      type: 'composite',
      operator: 'AND',
      conditions: [
        { type: 'node-type', nodeTypes: ['FRAME'] },
        { type: 'property', property: 'width' },
      ],
    },
    action: {
      type: 'prefix',
      value: (node) => {
        const width = (node as FrameNode).width;
        if (width >= 1200) return 'Desktop.';
        if (width >= 768) return 'Tablet.';
        if (width >= 320) return 'Mobile.';
        return '';
      },
    },
  },
];

/**
 * Built-in rules for the Development domain
 */
export const DEFAULT_DEV_RULES: NamingRule[] = [
  // Message type convention
  {
    id: 'message-type-format',
    name: 'Message Type Format',
    domain: 'dev',
    priority: 100,
    enabled: true,
    condition: {
      type: 'name-pattern',
      pattern: /^[a-z]/,
    },
    action: {
      type: 'template',
      template: '{domain}:{action}:{target}',
    },
  },
];
```

---

## Transforms

### Name Transformation Utilities

```typescript
// src/core/naming/transforms.ts

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert string to UPPER_CASE
 */
export function toUpperCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();
}

/**
 * Apply a template with token substitution
 */
export function applyTemplate(
  template: string,
  node: SceneNode,
  currentName: string
): string {
  const tokens: Record<string, string | undefined> = {
    type: node.type,
    name: currentName,
    width: 'width' in node ? String(Math.round(node.width)) : undefined,
    height: 'height' in node ? String(Math.round(node.height)) : undefined,
    parent: node.parent && 'name' in node.parent ? node.parent.name : undefined,
    breakpoint: getBreakpointName(node),
    state: getStateName(currentName),
    block: getBlockName(currentName),
    element: getElementName(currentName),
    modifier: getModifierName(currentName),
    category: getCategoryName(currentName),
    title: getTitleName(currentName),
  };
  
  // Replace required tokens: {token}
  let result = template.replace(/\{(\w+)\}/g, (match, key) => {
    return tokens[key] ?? match;
  });
  
  // Replace optional tokens: {token?} (remove if undefined)
  result = result.replace(/\{(\w+)\?\}/g, (match, key) => {
    return tokens[key] ?? '';
  });
  
  // Clean up multiple separators
  result = result
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
    
  return result;
}

/**
 * Detect breakpoint name from frame width
 */
function getBreakpointName(node: SceneNode): string {
  if (!('width' in node)) return 'Frame';
  const width = node.width;
  if (width >= 1440) return 'Wide';
  if (width >= 1024) return 'Desktop';
  if (width >= 768) return 'Tablet';
  if (width >= 320) return 'Mobile';
  return 'Frame';
}

/**
 * Detect state name from layer name
 */
function getStateName(name: string): string | undefined {
  const states = ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading', 'Error', 'Success'];
  const lowerName = name.toLowerCase();
  return states.find(state => lowerName.includes(state.toLowerCase()));
}

/**
 * Extract BEM block name
 */
function getBlockName(name: string): string {
  const parts = name.split(/[.\s]/);
  return parts[0] || name;
}

/**
 * Extract BEM element name
 */
function getElementName(name: string): string | undefined {
  const parts = name.split(/[.\s]/);
  return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Extract BEM modifier name
 */
function getModifierName(name: string): string | undefined {
  const parts = name.split(/[.\s]/);
  return parts.length > 2 ? parts.slice(2).join('.') : undefined;
}

/**
 * Extract category from section header
 */
function getCategoryName(name: string): string {
  const match = name.match(/^\[([A-Z]+)\]/);
  return match ? match[1] : 'GENERAL';
}

/**
 * Extract title from formatted name
 */
function getTitleName(name: string): string {
  // Remove known prefixes
  return name
    .replace(/^↳\s*/, '')
    .replace(/^\[[A-Z]+\]\s*/, '')
    .replace(/^[🔴🟠🟡🟢🔵🟣⚫️⚪️🚧✅👀🚀🚫🪦⭐📱🏷️📌🎯💡🔥💎🎨🟥🟧🟨🟩🟦🟪⬛⬜]\s*/, '')
    .replace(/^\d{2}\.\d{2}\s*:\s*/, '')
    .trim();
}
```

---

## Validation

### Validation Engine

```typescript
// src/core/naming/validators.ts

import { VALIDATION_PATTERNS } from './schema';
import type { ValidationResult, ValidationError, ValidationWarning, ParsedName, NamingDomain } from './types';

/**
 * Validate a name against taxonomy rules
 */
export function validateName(
  name: string,
  domain: NamingDomain,
  elementType?: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Domain-specific validation
  switch (domain) {
    case 'design':
      validateDesignName(name, elementType, errors, warnings, suggestions);
      break;
    case 'dev':
      validateDevName(name, elementType, errors, warnings, suggestions);
      break;
    case 'business':
      validateBusinessName(name, elementType, errors, warnings, suggestions);
      break;
    case 'delivery':
      validateDeliveryName(name, errors, warnings, suggestions);
      break;
  }
  
  const parsedName = parseName(name, domain);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    parsedName,
  };
}

/**
 * Validate design domain names
 */
function validateDesignName(
  name: string,
  elementType: string | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  switch (elementType) {
    case 'page':
      if (!VALIDATION_PATTERNS.pageTitle.test(name)) {
        if (!name.startsWith('↳')) {
          warnings.push({
            code: 'DESIGN_PAGE_PREFIX',
            message: 'Page titles conventionally start with ↳',
            suggestion: `↳ ${name}`,
          });
          suggestions.push(`↳ ${name}`);
        }
      }
      break;
      
    case 'section':
      if (!VALIDATION_PATTERNS.sectionHeader.test(name)) {
        const cleanName = name.replace(/^\[.*?\]\s*/, '');
        warnings.push({
          code: 'DESIGN_SECTION_FORMAT',
          message: 'Section headers conventionally use [CATEGORY] format',
          suggestion: `[COMPONENTS] ${cleanName}`,
        });
        suggestions.push(`[COMPONENTS] ${cleanName}`);
      }
      break;
      
    case 'frame':
      // Check for descriptive name vs default
      if (/^Frame\s*\d*$/.test(name)) {
        warnings.push({
          code: 'DESIGN_FRAME_GENERIC',
          message: 'Frame has default name. Consider a descriptive name.',
        });
      }
      break;
      
    case 'layer':
      // Check for default layer names
      if (/^(Rectangle|Ellipse|Group|Vector)\s*\d*$/.test(name)) {
        warnings.push({
          code: 'DESIGN_LAYER_GENERIC',
          message: 'Layer has default name. Consider a descriptive name.',
        });
      }
      break;
  }
}

/**
 * Validate development domain names
 */
function validateDevName(
  name: string,
  elementType: string | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  switch (elementType) {
    case 'message':
      if (!VALIDATION_PATTERNS.messageType.test(name)) {
        errors.push({
          code: 'DEV_MESSAGE_FORMAT',
          message: 'Message types should use domain:action:target format',
          suggestion: convertToMessageFormat(name),
        });
        suggestions.push(convertToMessageFormat(name));
      }
      break;
      
    case 'handler':
      if (!VALIDATION_PATTERNS.handlerName.test(name)) {
        warnings.push({
          code: 'DEV_HANDLER_FORMAT',
          message: 'Handler names should use handleDomainAction format',
        });
      }
      break;
  }
}

/**
 * Validate business domain names
 */
function validateBusinessName(
  name: string,
  elementType: string | undefined,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  switch (elementType) {
    case 'ticket':
      if (!VALIDATION_PATTERNS.ticketId.test(name.split(':')[0]?.trim() ?? '')) {
        warnings.push({
          code: 'BIZ_TICKET_FORMAT',
          message: 'Ticket IDs conventionally use PROJECT-TYPE-### format',
          suggestion: 'STRAT-FEAT-001: ' + name,
        });
      }
      break;
      
    case 'feature':
      if (!VALIDATION_PATTERNS.featureSlug.test(name)) {
        const slug = toKebabCase(name);
        warnings.push({
          code: 'BIZ_FEATURE_FORMAT',
          message: 'Feature slugs should use kebab-case',
          suggestion: slug,
        });
        suggestions.push(slug);
      }
      break;
  }
}

/**
 * Validate delivery domain names
 */
function validateDeliveryName(
  name: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  // Check for spaces
  if (/\s/.test(name)) {
    errors.push({
      code: 'DELIVERY_NO_SPACES',
      message: 'Asset names cannot contain spaces',
      suggestion: name.replace(/\s+/g, '-').toLowerCase(),
    });
    suggestions.push(name.replace(/\s+/g, '-').toLowerCase());
  }
  
  // Check for uppercase
  if (/[A-Z]/.test(name)) {
    warnings.push({
      code: 'DELIVERY_LOWERCASE',
      message: 'Asset names should be lowercase',
      suggestion: name.toLowerCase(),
    });
    suggestions.push(name.toLowerCase());
  }
  
  // Check for special characters
  if (/[^a-zA-Z0-9._\-\/]/.test(name)) {
    warnings.push({
      code: 'DELIVERY_SPECIAL_CHARS',
      message: 'Asset names should only contain alphanumeric characters, dots, hyphens, and slashes',
    });
  }
}

/**
 * Convert legacy message name to new format
 */
function convertToMessageFormat(name: string): string {
  // Convert camelCase to domain:action:target
  // e.g., "addEmojiToLayer" → "layer:add:emoji"
  const words = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/);
  
  if (words.length >= 2) {
    const action = words[0];
    const target = words.slice(1).join('-');
    return `layer:${action}:${target}`;
  }
  
  return name;
}

/**
 * Helper: convert to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Parse a name into structured tokens
 */
function parseName(name: string, domain: NamingDomain): ParsedName {
  // Implementation would parse based on domain patterns
  // Simplified version:
  return {
    original: name,
    domain,
    tokens: [],
    isValid: true,
    errors: [],
    suggestions: [],
  };
}
```

---

## Integration Points

### Plugin Feature Integration

```typescript
// src/features/auto-labeling.ts

import type { NamingRule, NamingPreferences } from '../core/naming/types';
import { findMatchingRules, applyRuleAction } from '../core/naming/rules';
import { validateName } from '../core/naming/validators';
import { DEFAULT_DESIGN_RULES } from '../core/naming/default-rules';

/**
 * Auto-label selected nodes based on naming rules
 */
export async function autoLabelSelection(
  customRules?: NamingRule[]
): Promise<{ success: boolean; count: number; results: LabelResult[] }> {
  const selection = figma.currentPage.selection;
  const rules = [...DEFAULT_DESIGN_RULES, ...(customRules ?? [])];
  const results: LabelResult[] = [];
  
  for (const node of selection) {
    if (!('name' in node)) continue;
    
    const context = buildRuleContext(node);
    const matchingRules = findMatchingRules(node, rules, context);
    
    if (matchingRules.length === 0) {
      results.push({ node, changed: false, reason: 'No matching rules' });
      continue;
    }
    
    // Apply first matching rule
    const rule = matchingRules[0];
    const newName = applyRuleAction(node, rule, node.name);
    
    if (newName !== node.name) {
      const oldName = node.name;
      node.name = newName;
      results.push({ node, changed: true, oldName, newName, rule: rule.name });
    } else {
      results.push({ node, changed: false, reason: 'Name unchanged' });
    }
  }
  
  return {
    success: true,
    count: results.filter(r => r.changed).length,
    results,
  };
}

/**
 * Validate names of selected nodes
 */
export async function validateSelection(): Promise<ValidationSummary> {
  const selection = figma.currentPage.selection;
  const issues: ValidationIssue[] = [];
  
  for (const node of selection) {
    if (!('name' in node)) continue;
    
    const elementType = getElementType(node);
    const result = validateName(node.name, 'design', elementType);
    
    if (!result.isValid || result.warnings.length > 0) {
      issues.push({
        nodeId: node.id,
        nodeName: node.name,
        errors: result.errors,
        warnings: result.warnings,
        suggestions: result.suggestions,
      });
    }
  }
  
  return {
    totalChecked: selection.length,
    issueCount: issues.length,
    issues,
  };
}

/**
 * Build rule context from a node
 */
function buildRuleContext(node: SceneNode): RuleContext {
  let depth = 0;
  let current: BaseNode | null = node;
  while (current && current.type !== 'PAGE') {
    depth++;
    current = current.parent;
  }
  
  const parent = node.parent;
  const siblings = parent && 'children' in parent ? parent.children : [];
  const siblingIndex = siblings.indexOf(node);
  
  return {
    page: figma.currentPage,
    depth,
    siblingIndex,
    siblingCount: siblings.length,
    parentName: parent && 'name' in parent ? parent.name : undefined,
    selection: figma.currentPage.selection,
  };
}

/**
 * Determine element type from node
 */
function getElementType(node: SceneNode): string {
  switch (node.type) {
    case 'PAGE': return 'page';
    case 'SECTION': return 'section';
    case 'FRAME':
      // Check if top-level (likely a "frame" in design terms)
      if (node.parent?.type === 'PAGE') return 'frame';
      return 'layer';
    case 'COMPONENT': return 'component';
    case 'INSTANCE': return 'instance';
    default: return 'layer';
  }
}

interface LabelResult {
  node: SceneNode;
  changed: boolean;
  oldName?: string;
  newName?: string;
  rule?: string;
  reason?: string;
}

interface ValidationIssue {
  nodeId: string;
  nodeName: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationSummary {
  totalChecked: number;
  issueCount: number;
  issues: ValidationIssue[];
}
```

### Message Type Integration (Future Refactor)

```typescript
// Proposed message type structure following taxonomy

// Current (to migrate from):
type MessageType = 'add-emoji' | 'clear-emoji' | 'save-bookmark' | ...;

// Proposed (taxonomy-compliant):
type TaxonomyMessageType = 
  | 'layer:emoji:add'
  | 'layer:emoji:clear'
  | 'layer:emoji:navigate'
  | 'bookmark:anchor:save'
  | 'bookmark:anchor:remove'
  | 'bookmark:anchor:jump'
  | 'nav:history:back'
  | 'nav:history:forward'
  | 'nav:layer:enter'
  | 'nav:layer:exit'
  | 'ui:theme:set'
  | 'ui:section:toggle'
  | 'ui:resize:height';

// Backward compatibility layer
const MESSAGE_TYPE_MAP: Record<string, TaxonomyMessageType> = {
  'add-emoji': 'layer:emoji:add',
  'clear-emoji': 'layer:emoji:clear',
  'save-bookmark': 'bookmark:anchor:save',
  // ... etc
};
```

---

## Storage

### Preferences Persistence

```typescript
// Naming preferences stored via figma.clientStorage

const STORAGE_KEY = 'namingPreferences';

export async function loadNamingPreferences(): Promise<NamingPreferences> {
  try {
    const data = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (data && typeof data === 'object') {
      return data as NamingPreferences;
    }
  } catch (error) {
    console.error('Failed to load naming preferences:', error);
  }
  
  return getDefaultPreferences();
}

export async function saveNamingPreferences(prefs: NamingPreferences): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEY, prefs);
  } catch (error) {
    console.error('Failed to save naming preferences:', error);
  }
}

function getDefaultPreferences(): NamingPreferences {
  return {
    enabled: true,
    autoApplyOnCreate: false,
    showValidationWarnings: true,
    customRules: [],
    domainDefaults: {
      design: {},
      dev: {},
      business: {},
      delivery: {},
    },
  };
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// test/naming-taxonomy.test.ts

describe('Naming Taxonomy', () => {
  describe('Validation', () => {
    it('validates page titles correctly', () => {
      const valid = validateName('↳ 🟢 12.01 : Homepage', 'design', 'page');
      expect(valid.isValid).toBe(true);
      
      const invalid = validateName('Homepage', 'design', 'page');
      expect(invalid.warnings.length).toBeGreaterThan(0);
    });
    
    it('validates message types correctly', () => {
      const valid = validateName('layer:add:emoji', 'dev', 'message');
      expect(valid.isValid).toBe(true);
      
      const invalid = validateName('addEmojiToLayer', 'dev', 'message');
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('Transforms', () => {
    it('converts to kebab-case', () => {
      expect(toKebabCase('MyComponentName')).toBe('my-component-name');
      expect(toKebabCase('already-kebab')).toBe('already-kebab');
    });
    
    it('applies templates correctly', () => {
      const result = applyTemplate('{breakpoint}.{name}', mockNode, 'Hero');
      expect(result).toBe('Desktop.Hero');
    });
  });
  
  describe('Rules', () => {
    it('matches node type conditions', () => {
      const rule = DEFAULT_DESIGN_RULES.find(r => r.id === 'frame-type-prefix');
      const matches = evaluateCondition(rule.condition, mockFrameNode, mockContext);
      expect(matches).toBe(true);
    });
  });
});
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Create `src/core/naming/` directory structure
- [ ] Implement type definitions
- [ ] Implement schema and patterns
- [ ] Implement transforms

### Phase 2: Validation Engine
- [ ] Implement validators
- [ ] Create validation error/warning types
- [ ] Add suggestion generation

### Phase 3: Rule Engine
- [ ] Implement rule matching
- [ ] Implement rule actions
- [ ] Create default rule sets

### Phase 4: Feature Integration
- [ ] Create `autoLabelSelection` feature
- [ ] Add validation to selection change
- [ ] Create preferences UI (future)

### Phase 5: Message Type Migration
- [ ] Define new message type taxonomy
- [ ] Create migration mapping
- [ ] Update message handlers

---

## References

- Requirements: `.kiro/specs/naming-taxonomy/requirements.md`
- Existing emoji system: `src/features/emoji-manager.ts`
- Page title utilities: `src/utils/utils.ts`
- State management: `src/core/state.ts`
- Message handling: `src/code.ts`
