import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import { createError } from '../../../middlewares/error.js';
import * as systemConfigService from '../services/systemConfigService.js';
import { listSystemConfigsQuerySchema, keyParamSchema, upsertSystemConfigBodySchema } from '../validators/schemas.js';

export const listSystemConfigs = async (ctx) => {
  await validateQuery(ctx, listSystemConfigsQuerySchema);
  const data = await systemConfigService.listSystemConfigs(ctx.query);
  ctx.body = { code: 200, message: 'success', data };
};

export const getSystemConfig = async (ctx) => {
  const { key } = await validateParams(ctx, keyParamSchema);

  const record = await systemConfigService.getSystemConfigByKey(key);
  ctx.body = { code: 200, message: 'success', data: record };
};

export const upsertSystemConfig = async (ctx) => {
  const { key } = await validateParams(ctx, keyParamSchema);
  await validateBody(ctx, upsertSystemConfigBodySchema);

  const record = await systemConfigService.upsertSystemConfigByKey(key, ctx.request.body ?? {});
  ctx.body = { code: 200, message: 'success', data: record };
};

export default { listSystemConfigs, getSystemConfig, upsertSystemConfig };
