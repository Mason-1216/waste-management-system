import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const resolveEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const formatToday = () => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const waitForToastText = async (page, text, timeoutMs) => {
  const toast = page.locator('.el-message').filter({ hasText: text }).first();
  await toast.waitFor({ state: 'visible', timeout: timeoutMs });
};

const clickExportAndAssert = async ({ page, title, click, allowAnyWarning }) => {
  const expectedFileName = `${title}_${formatToday()}.xlsx`;

  await mkdir('test-results/downloads', { recursive: true });

  await page.evaluate(() => {
    if (!Array.isArray(window.__WMS_EXPORT_EVENTS__)) {
      window.__WMS_EXPORT_EVENTS__ = [];
    } else {
      window.__WMS_EXPORT_EVENTS__.length = 0;
    }
  });

  const exportEventPromise = page.waitForFunction(() => Array.isArray(window.__WMS_EXPORT_EVENTS__) && window.__WMS_EXPORT_EVENTS__.length > 0, null, { timeout: 180000 })
    .then(() => page.evaluate(() => window.__WMS_EXPORT_EVENTS__[window.__WMS_EXPORT_EVENTS__.length - 1]))
    .then((evt) => ({ kind: 'exportEvent', evt }))
    .catch(() => null);

  const warningToastPromise = page.locator('.el-message.el-message--warning').first()
    .waitFor({ state: 'visible', timeout: 180000 })
    .then(async () => {
      const text = await page.locator('.el-message.el-message--warning').first().innerText();
      return { kind: 'warning', message: typeof text === 'string' ? text.trim() : '' };
    })
    .catch(() => null);
  const errorToastPromise = page.locator('.el-message.el-message--error').first()
    .waitFor({ state: 'visible', timeout: 180000 })
    .then(async () => {
      const text = await page.locator('.el-message.el-message--error').first().innerText();
      return { kind: 'fail', message: typeof text === 'string' ? text.trim() : '' };
    })
    .catch(() => null);
  await click();

  const race = await Promise.race([exportEventPromise, warningToastPromise, errorToastPromise]);

  if (!race) {
    throw new Error('批量导出未触发导出事件，也未提示“没有可导出的数据/导出失败”');
  }

  if (race.kind === 'exportEvent') {
    const fileName = typeof race.evt?.fileName === 'string' ? race.evt.fileName.trim() : '';
    await expect(fileName).toBe(expectedFileName);
    return;
  }

  if (race.kind === 'fail') {
    const msg = typeof race.message === 'string' && race.message ? race.message : '导出失败';
    throw new Error(`批量导出失败：${msg}`);
  }

  if (race.kind === 'warning') {
    const msg = typeof race.message === 'string' && race.message ? race.message : 'warning';
    if (allowAnyWarning) {
      return;
    }
    if (msg.includes('没有可导出的数据')) {
      return;
    }
    throw new Error(`批量导出警告：${msg}`);
  }
};

const loginAndSeedLocalStorage = async ({ page }) => {
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
    const reason = loginPayload?.message ? loginPayload.message : loginResponse.status();
    throw new Error(`E2E login failed: ${reason}`);
  }

  const { token, user } = loginPayload.data;

  const stationResponse = await page.request.get(`${apiBaseUrl}/stations/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const stationPayload = await stationResponse.json();
  const stations = Array.isArray(stationPayload?.data) ? stationPayload.data : [];
  const firstStation = stations.length > 0 ? stations[0] : null;

  await page.addInitScript((payload) => {
    localStorage.setItem('user-store', JSON.stringify(payload));
    window.__WMS_EXPORT_EVENTS__ = [];
    window.__WMS_EXPORT_HOOK__ = (evt) => {
      if (!Array.isArray(window.__WMS_EXPORT_EVENTS__)) {
        window.__WMS_EXPORT_EVENTS__ = [];
      }
      window.__WMS_EXPORT_EVENTS__.push(evt);
    };
  }, {
    token,
    userInfo: user,
    currentStationId: firstStation?.id ?? null
  });
};

const routesToTest = [
  // Admin
  { title: '用户管理', path: '/user-management' },
  { title: '组织架构', path: '/organization-management' },

  // Schedule
  { title: '排班管理', path: '/schedule/manage' },

  // Task
  { title: '岗位工作任务汇总表', path: '/position-work/management' },
  { title: '岗位工作完成情况记录', path: '/position-work/records' },
  { title: '临时任务填报', path: '/temporary-tasks/fill' },
  { title: '临时任务完成情况记录', path: '/temporary-tasks/history' },
  { title: '临时工作任务汇总表', path: '/temporary-tasks/library' },

  // Maintenance
  { title: '故障上报', path: '/device-faults/records' },
  { title: '设备管理', path: '/device-faults/equipment' },
  { title: '维修任务汇总表', path: '/device-faults/task-library' },
  { title: '设备管理', path: '/fault-report', tab: '设备管理' },
  { title: '故障列表', path: '/fault-list' },
  { title: '维修派发单', path: '/maintenance-dispatch' },
  { title: '维修工作', path: '/repair-work' },
  { title: '设备维修记录', path: '/repair-records' },
  { title: '新建维修记录', path: '/repair-record/new' },
  { title: '保养工作记录', path: '/maintenance-task/records' },
  { title: '设备保养计划', path: '/maintenance-task/plan' },
  { title: '保养计划岗位分配', path: '/maintenance-task/position' },
  { title: '保养计划', path: '/maintenance-plan' },
  { title: '保养记录', path: '/maintenance-record' },

  // Inspection
  { title: '卫生自检', path: '/hygiene-self-inspection', needsQueryView: true },
  { title: '卫生他检', path: '/hygiene-other-inspection', needsQueryView: true },
  { title: '安全自检', path: '/safety-self-inspection', needsQueryView: true },
  { title: '安全他检', path: '/safety-other-inspection', needsQueryView: true },
  { title: '安全隐患', path: '/safety-rectification', needsQueryView: true },
  { title: '卫生工作管理', path: '/hygiene-work-arrangement', exportDialog: true },
  { title: '安全检查项目', path: '/safety-check-management' },

  // Support
  { title: '帮助与反馈', path: '/help-feedback' },

  // PLC
  { title: 'PLC数据', path: '/plc-records', plcTab: '实时监控' },
  { title: 'PLC数据', path: '/plc-records', plcTab: '配置管理' },
  { title: 'PLC数据', path: '/plc-records', plcTab: '历史记录' },
  { title: 'PLC数据', path: '/plc-records', plcTab: '数据分类管理' },
  { title: 'PLC数据报表', path: '/plc-data-report' },

  // Points
  { title: '积分明细表', path: '/points-summary/summary/detail' },
  { title: '积分统计表', path: '/points-summary/summary/stats' }
];

test.describe('batch export smoke', () => {
  test('each page export works (download or no-data)', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);
    await loginAndSeedLocalStorage({ page });

    for (const item of routesToTest) {
      await test.step(`${item.title} ${item.path}${item.plcTab ? ` (${item.plcTab})` : ''}`, async () => {
        await page.goto(item.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle');

        if (item.needsQueryView) {
          const queryButton = page.getByRole('button', { name: '查询' }).first();
          const count = await queryButton.count();
          if (count > 0) {
            await queryButton.click();
            await page.waitForLoadState('networkidle');
          }
        }

        if (item.plcTab) {
          await page.getByRole('tab', { name: item.plcTab }).click();
          await page.waitForLoadState('networkidle');
        }

        if (item.tab) {
          await page.getByRole('tab', { name: item.tab }).click();
          await page.waitForLoadState('networkidle');
        }

        if (item.exportDialog) {
          const openButton = page.getByRole('button', { name: '批量导出' }).first();
          await expect(openButton).toBeVisible();
          await openButton.click();

          const dialog = page.locator('.el-dialog').filter({ hasText: '批量导出' }).first();
          await expect(dialog).toBeVisible();
          const stationCombobox = dialog.getByRole('combobox').first();
          await expect(stationCombobox).toBeVisible();
          await stationCombobox.click();

          const dropdown = page.locator('.el-select-dropdown:visible').first();
          await expect(dropdown).toBeVisible();
          const firstStationOption = dropdown.locator('.el-select-dropdown__item:not(.is-disabled)').first();
          await firstStationOption.scrollIntoViewIfNeeded();
          await firstStationOption.click({ timeout: 10000 });

          const checkboxList = dialog.locator('.el-checkbox');
          const checkboxCount = await checkboxList.count();
          if (checkboxCount > 0) {
            await checkboxList.first().click();
          }

          const confirmButton = page.locator('.el-dialog').getByRole('button', { name: '批量导出' }).first();
          await expect(confirmButton).toBeVisible();

          await clickExportAndAssert({
            page,
            title: item.title,
            click: async () => {
              await confirmButton.click();
            },
            allowAnyWarning: true
          });
          return;
        }

        const exportButton = page.getByRole('button', { name: '批量导出' }).first();
        await expect(exportButton).toBeVisible();

        await clickExportAndAssert({
          page,
          title: item.title,
          click: async () => {
            await exportButton.click();
          }
        });
      });
    }
  });
});
