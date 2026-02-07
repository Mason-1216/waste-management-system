import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  },
  reporter: [['list']],
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000
  }
});
