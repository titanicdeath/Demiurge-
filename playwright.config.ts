import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'pnpm --filter @demiurge/web dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120000
  },
  use: { baseURL: 'http://127.0.0.1:5173', headless: true }
});
