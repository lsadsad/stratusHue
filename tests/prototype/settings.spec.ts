import { test, expect } from '@playwright/test';

test.describe('prototype plugin UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Bridge tries localhost WS in prototype — no server is expected
        if (/WebSocket connection to 'ws:\/\/localhost:\d+\/' failed/.test(text)) return;
        throw new Error(`Console error: ${text}`);
      }
    });
    await page.goto('/plugin.html');
    await page.waitForSelector('#plugin-chrome', { state: 'visible' });
    await page.waitForSelector('#settings-btn', { state: 'visible' });
    // Shim fires mock sandbox messages after 300ms
    await page.waitForTimeout(400);
  });

  test('loads navigate UI without Validate mode strip', async ({ page }) => {
    await expect(page.locator('#mode-strip')).toHaveCount(0);
    await expect(page.locator('#validate-main')).toHaveCount(0);
    await expect(page.locator('#navigate-main')).toBeVisible();
  });

  test('settings overlay opens and has no Design Lint section', async ({ page }) => {
    await page.locator('#settings-btn').click();
    const overlay = page.locator('#settings-overlay');
    await expect(overlay).toHaveClass(/open/);

    await expect(page.locator('#lint-settings-section')).toHaveCount(0);
    await expect(page.locator('text=Design Lint')).toHaveCount(0);
  });

  test('date format and position controls toggle active state', async ({ page }) => {
    await page.locator('#settings-btn').click();
    await expect(page.locator('#date-format-control')).toBeVisible();
    await expect(page.locator('#date-position-control')).toBeVisible();

    const alphaBtn = page.locator('#date-format-control [data-value="alpha"]');
    await alphaBtn.click();
    await expect(alphaBtn).toHaveClass(/active/);

    const suffixBtn = page.locator('#date-position-control [data-value="suffix"]');
    await suffixBtn.click();
    await expect(suffixBtn).toHaveClass(/active/);
  });

  test('bridge settings section is present on dev build', async ({ page }) => {
    await page.locator('#settings-btn').click();
    await expect(page.locator('#bridge-settings-section')).toBeVisible();
    // The native checkbox is deliberately opacity:0/0x0 (.toggle-switch input in
    // styles.css) — the .toggle-slider span is the visible control. Assert on that.
    await expect(page.locator('#bridge-settings-section .toggle-slider')).toBeVisible();
  });

  test('footer bridge status dots render when bridge is enabled', async ({ page }) => {
    await page.locator('#settings-btn').click();
    await page.locator('label[for="bridge-enable-toggle"]').click();
    await page.keyboard.press('Escape');

    await expect(page.locator('#bridge-status-dots')).toBeVisible();
    await expect(page.locator('#bridge-status-local')).toBeVisible();
    await expect(page.locator('#bridge-status-cloud')).toBeVisible();
  });
});
