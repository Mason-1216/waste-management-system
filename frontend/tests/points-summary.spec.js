import { test, expect } from '@playwright/test';

const resolveEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

test('points summary fixed points drilldown', async ({ page }) => {
  const username = resolveEnv('E2E_USERNAME');
  const password = resolveEnv('E2E_PASSWORD');
  const apiBaseUrl = resolveEnv('E2E_API_BASE_URL');
  if (!username || !password || !apiBaseUrl) {
    test.skip(true, 'E2E_USERNAME/E2E_PASSWORD/E2E_API_BASE_URL not set');
  }

  const loginResponse = await page.request.post(`${apiBaseUrl}/auth/login`, {
    data: { username, password }
  });
  const loginPayload = await loginResponse.json();
  if (loginPayload?.code !== 200 || !loginPayload?.data?.token) {
    const failureMessage = loginPayload?.message;
    const fallbackStatus = loginResponse.status();
    const reason = failureMessage ? failureMessage : fallbackStatus;
    throw new Error(`E2E login failed: ${reason}`);
  }

  const { token, user } = loginPayload.data;
  await page.addInitScript((payload) => {
    localStorage.setItem('user-store', JSON.stringify(payload));
  }, { token, userInfo: user, currentStationId: user.lastStationId });

  await page.goto('/points-summary/summary/stats');
  await page.waitForLoadState('domcontentloaded');
  const currentUrl = page.url();
  if (!currentUrl.includes('/points-summary')) {
    throw new Error(`Missing points summary access. Current URL: ${currentUrl}`);
  }

  await page.waitForLoadState('networkidle');
  const table = page.getByTestId('points-summary-table');
  await expect(table).toBeVisible();

  const toggles = page.getByTestId('fixed-points-toggle');
  const count = await toggles.count();
  let clicked = false;

  for (let i = 0; i < count; i += 1) {
    const text = (await toggles.nth(i).innerText()).trim();
    if (!text || text === '-' || text === '0' || text === '0.00') {
      continue;
    }
    await toggles.nth(i).click();
    clicked = true;
    break;
  }

  if (!clicked) {
    test.skip(true, 'No fixed points data available for drilldown.');
  }

  await expect(page.getByTestId('points-summary-row-drilldown')).toBeVisible();
  await expect(page.getByTestId('points-summary-row-drilldown-table')).toBeVisible();
});
