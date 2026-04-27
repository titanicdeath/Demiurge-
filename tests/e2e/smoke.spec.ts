import { test, expect } from '@playwright/test';

test('app renders and wasm status appears', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Demiurge Milestone 1' })).toBeVisible();
  await expect(page.locator('#status')).toContainText('WASM loaded: ok');
});
