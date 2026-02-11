import { defineConfig } from '@playwright/test';

const resolveEnvText = (key) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const resolvedBaseURL = resolveEnvText('E2E_BASE_URL');
const baseURL = resolvedBaseURL ? resolvedBaseURL : 'http://localhost';

const useDevServerFlag = resolveEnvText('E2E_USE_DEV_SERVER');
const useDevServer = useDevServerFlag === '1' || useDevServerFlag.toLowerCase() === 'true';

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
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    downloadsPath: 'test-results/downloads',
    timezoneId: 'Asia/Shanghai'
  },
  reporter: [['list']],
  webServer: useDevServer
    ? {
      command: 'npm run dev -- --host 0.0.0.0 --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120000
    }
    : undefined
});
