import { createError } from '../../../middlewares/error.js';
import * as systemConfigService from '../services/systemConfigService.js';

export const listSystemConfigs = async (ctx) => {
  const data = await systemConfigService.listSystemConfigs(ctx.query);
  ctx.body = { code: 200, message: 'success', data };
};

export const getSystemConfig = async (ctx) => {
  const { key } = ctx.params;
  if (!key) throw createError(400, 'Missing key');

  const record = await systemConfigService.getSystemConfigByKey(key);
  ctx.body = { code: 200, message: 'success', data: record };
};

export const upsertSystemConfig = async (ctx) => {
  const { key } = ctx.params;
  if (!key) throw createError(400, 'Missing key');

  const record = await systemConfigService.upsertSystemConfigByKey(key, ctx.request.body || {});
  ctx.body = { code: 200, message: 'success', data: record };
};

export default { listSystemConfigs, getSystemConfig, upsertSystemConfig };
