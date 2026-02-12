import { Joi } from '../../core/validators/validate.js';

export const quarterlyAwardGroupQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
  quarter: Joi.number().integer().min(1).max(4).optional()
});

export const quarterlyAwardGroupCreateSchema = Joi.object({
  group_name: Joi.string().trim().max(100).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  quarter: Joi.number().integer().min(1).max(4).required(),
  per_capita_budget: Joi.number().min(0).optional(),
  performance_score: Joi.number().min(0).max(200).optional(),
  linked_group_id: Joi.number().integer().min(1).optional().allow(null),
  user_ids: Joi.array().items(Joi.number().integer().min(1)).optional()
});

export const quarterlyAwardGroupUpdateSchema = Joi.object({
  group_name: Joi.string().trim().max(100).optional(),
  per_capita_budget: Joi.number().min(0).optional(),
  performance_score: Joi.number().min(0).max(200).optional(),
  linked_group_id: Joi.number().integer().min(1).optional().allow(null),
  user_ids: Joi.array().items(Joi.number().integer().min(1)).optional()
});

export const quarterlyAwardCalculateSchema = Joi.object({
  group_id: Joi.number().integer().min(1).required()
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const quarterlyAwardHistoryQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
  quarter: Joi.number().integer().min(1).max(4).optional(),
  group_name: Joi.string().trim().max(100).optional(),
  user_name: Joi.string().trim().max(50).optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(500).optional()
});

export const quarterlyAwardVisualQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
  quarter: Joi.number().integer().min(1).max(4).optional(),
  group_id: Joi.number().integer().min(1).optional()
});

export const quarterlyPointsSummaryQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  quarter: Joi.number().integer().min(1).max(4).required(),
  user_ids: Joi.array().items(Joi.number().integer().min(1)).optional()
});

export default {
  quarterlyAwardGroupQuerySchema,
  quarterlyAwardGroupCreateSchema,
  quarterlyAwardGroupUpdateSchema,
  quarterlyAwardCalculateSchema,
  idParamSchema,
  quarterlyAwardHistoryQuerySchema,
  quarterlyAwardVisualQuerySchema,
  quarterlyPointsSummaryQuerySchema
};
