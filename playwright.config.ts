import { defineConfig } from '@playwright/test';

const PORT = 3456;

export default defineConfig({
  testDir: 'tests/prototype',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx serve prototype -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/plugin.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
