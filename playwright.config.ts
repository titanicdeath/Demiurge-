import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'pnpm --filter @demiurge/web dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000
  },
  use: { baseURL: 'http://localhost:5173', headless: true }
});
