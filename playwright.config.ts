import { defineConfig } from '@playwright/test';

const PORT = 3456;

export default defineConfig({
  testDir: 'tests/prototype',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    // The shim renders #plugin-chrome unclipped (main.scrollable-content gets
    // height:auto), so the chrome runs ~990px tall and the settings overlay is
    // sized to match it. At the 720px default the lower overlay sections land
    // above the viewport and, because the overlay is position:fixed, Playwright
    // cannot scroll them into view. Give the viewport room for the full chrome.
    viewport: { width: 1280, height: 1400 },
  },
  webServer: {
    command: `npx serve prototype -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/plugin.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
