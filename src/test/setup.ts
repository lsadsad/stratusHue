// Test setup file for vitest
// This file runs before each test file
import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};