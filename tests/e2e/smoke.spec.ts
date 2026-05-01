import { test, expect } from '@playwright/test';

test('m4 renderer mounts and draws canvas', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveJSProperty('width');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/milestone-04-screenshot.png', fullPage: true });
});

test.skip('m4 performance budget scaffold', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
});
