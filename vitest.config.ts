import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/**', // Playwright specs (testDir: tests/prototype) — run via `npm run test:prototype`
      'tools/**' // Dev-only utilities (design-system-assessment) — not part of the plugin gate; run via `npx vitest --run tools/` (see issue dsa)
    ]
  }
})