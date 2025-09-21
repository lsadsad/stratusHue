/// <reference types="@figma/plugin-typings" />

// Error Handling and Recovery for Stratus Hue Plugin
// Centralized error handling with recovery strategies

import { sendErrorToUI } from '../ui/ui-communication';
import { clearBookmarksCache } from './state';

// ===== ERROR TYPES =====
export enum ErrorType {
  BOOKMARK_NOT_FOUND = 'BOOKMARK_NOT_FOUND',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  STATE_CORRUPTION = 'STATE_CORRUPTION',
  UI_COMMUNICATION = 'UI_COMMUNICATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API',
  UNKNOWN = 'UNKNOWN'
}

export interface PluginError {
  type: ErrorType;
  message: string;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

// ===== ERROR HANDLERS =====
export function createError(
  type: ErrorType, 
  message: string, 
  context?: Record<string, unknown>, 
  recoverable = true
): PluginError {
  return { type, message, context, recoverable };
}

export function handleError(error: PluginError | Error | unknown): void {
  let pluginError: PluginError;
  
  if (error instanceof Error) {
    pluginError = createError(ErrorType.UNKNOWN, error.message, { stack: error.stack });
  } else if (typeof error === 'object' && error !== null && 'type' in error) {
    pluginError = error as PluginError;
  } else {
    pluginError = createError(ErrorType.UNKNOWN, String(error));
  }
  
  console.error('Plugin Error:', pluginError);
  
  // Attempt recovery based on error type
  attemptRecovery(pluginError);
  
  // Notify user if appropriate
  if (pluginError.recoverable) {
    figma.notify(pluginError.message);
  } else {
    figma.notify('A critical error occurred. Please restart the plugin.');
    sendErrorToUI(pluginError.message);
  }
}

// ===== RECOVERY STRATEGIES =====
function attemptRecovery(error: PluginError): void {
  switch (error.type) {
    case ErrorType.BOOKMARK_NOT_FOUND:
      // Bookmark cleanup is handled elsewhere
      break;
      
    case ErrorType.STATE_CORRUPTION:
      // Clear caches and force reload
      clearBookmarksCache();
      break;
      
    case ErrorType.STORAGE_ERROR:
      // Could implement storage fallback
      console.warn('Storage error - some data may be lost');
      break;
      
    case ErrorType.UI_COMMUNICATION:
      // Could implement UI reconnection
      console.warn('UI communication error - interface may be unresponsive');
      break;
      
    default:
      // Generic recovery - clear caches
      clearBookmarksCache();
  }
}

// ===== ERROR BOUNDARIES =====
export function withErrorBoundary<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorType: ErrorType = ErrorType.UNKNOWN
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const pluginError = createError(
        errorType,
        error instanceof Error ? error.message : String(error),
        { args, originalError: error }
      );
      handleError(pluginError);
      return null;
    }
  };
}

export function withSyncErrorBoundary<T extends unknown[], R>(
  fn: (...args: T) => R,
  errorType: ErrorType = ErrorType.UNKNOWN
) {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      const pluginError = createError(
        errorType,
        error instanceof Error ? error.message : String(error),
        { args, originalError: error }
      );
      handleError(pluginError);
      return null;
    }
  };
}

// ===== VALIDATION HELPERS =====
export function validateNodeExists(node: BaseNode | null): node is BaseNode {
  return node !== null && 'id' in node;
}

export function validateSceneNode(node: BaseNode | null): node is SceneNode {
  return validateNodeExists(node) && 'name' in node;
}

export function validateMessage(msg: unknown): msg is { type: string } {
  return typeof msg === 'object' && msg !== null && 'type' in msg && typeof (msg as Record<string, unknown>).type === 'string';
}

// ===== PERFORMANCE MONITORING =====
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      console.log(`${name} took ${end - start}ms`);
    });
  } else {
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  }
}