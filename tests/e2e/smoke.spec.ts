import { test, expect } from '@playwright/test';

test('renderer mounts and canvas is non-empty', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect((box?.width ?? 0) * (box?.height ?? 0)).toBeGreaterThan(0);
  await page.screenshot({ path: 'docs/milestone-04-screenshot.png', fullPage: true });
});
