import { Joi } from '../../core/validators/validate.js';

export const listSystemConfigsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  configType: Joi.string().valid('system', 'business', 'device').optional(),
  keyword: Joi.string().allow('').optional(),
  sortBy: Joi.string().allow('').optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional()
});

export const keyParamSchema = Joi.object({
  key: Joi.string().max(100).required()
});

export const upsertSystemConfigBodySchema = Joi.object({
  // Support both snake_case and camelCase keys for compatibility.
  config_value: Joi.any().optional(),
  configValue: Joi.any().optional(),
  config_type: Joi.string().valid('system', 'business', 'device').optional(),
  configType: Joi.string().valid('system', 'business', 'device').optional(),
  description: Joi.string().allow('').optional()
});

export default {
  listSystemConfigsQuerySchema,
  keyParamSchema,
  upsertSystemConfigBodySchema
};
