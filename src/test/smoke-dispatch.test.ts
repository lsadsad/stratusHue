/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Module-scope variable — set in beforeAll after code.ts import
let onmessage: ((msg: unknown) => Promise<void>) | null = null;

// ===== SETUP =====
beforeAll(async () => {
  // Add missing stubs that code.ts top-level side effects require
  (globalThis as any).figma.showUI = vi.fn();
  (globalThis as any).figma.on = vi.fn();
  (globalThis as any).figma.loadAllPagesAsync = vi.fn().mockResolvedValue(undefined);
  (globalThis as any).figma.openExternal = vi.fn();
  (globalThis as any).figma.currentPage.findAll = vi.fn().mockReturnValue([]);
  (globalThis as any).figma.currentPage.loadAsync = vi.fn().mockResolvedValue(undefined);

  // figma.root needs getPluginData / setPluginData for bookmarks (used in state.ts)
  if (!(globalThis as any).figma.root.getPluginData) {
    (globalThis as any).figma.root.getPluginData = vi.fn().mockReturnValue('');
    (globalThis as any).figma.root.setPluginData = vi.fn();
  }

  // __html__ is referenced at the top level of code.ts (figma.showUI(__html__, ...))
  (globalThis as any).__html__ = '';

  // Import code.ts — this triggers all top-level side effects including setting figma.ui.onmessage
  await import('../code');

  // Capture the handler that code.ts registered
  onmessage = (globalThis as any).figma.ui.onmessage as ((msg: unknown) => Promise<void>);
});

// ===== CRASH-DETECTION HELPER =====
/**
 * Calls the onmessage handler with the given message, then asserts:
 *  1. console.error was not called (excluding benign "dynamic import" messages)
 *  2. figma.notify was not called with an error-class string
 */
async function dispatchAndAssertNoCrash(msg: Record<string, unknown>): Promise<void> {
  expect(onmessage).toBeTypeOf('function');

  await (onmessage as (m: unknown) => Promise<void>)(msg);

  // Collect any console.error calls, filtering benign dynamic-import noise
  const errorCalls: unknown[][] = (console.error as ReturnType<typeof vi.fn>).mock.calls.filter(
    (args: unknown[]) => {
      const text = args.map(a => String(a)).join(' ').toLowerCase();
      return !text.includes('dynamic import');
    }
  );

  expect(errorCalls, `console.error was called unexpectedly: ${JSON.stringify(errorCalls)}`).toHaveLength(0);

  // Collect figma.notify calls that look like errors
  const notifyCalls: unknown[][] = ((globalThis as any).figma.notify as ReturnType<typeof vi.fn>).mock.calls;
  const errorNotifies = notifyCalls.filter((args: unknown[]) => {
    const text = args.map(a => String(a)).join(' ').toLowerCase();
    return text.includes('error') || text.includes('failed');
  });

  expect(errorNotifies, `figma.notify was called with an error-class message: ${JSON.stringify(errorNotifies)}`).toHaveLength(0);
}

// ===== TESTS =====
describe('sandbox message dispatch', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('onmessage handler was registered', () => {
    expect(typeof onmessage).toBe('function');
  });

  it('handles "get-theme-preference" without crashing', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-theme-preference' });
  });
});
