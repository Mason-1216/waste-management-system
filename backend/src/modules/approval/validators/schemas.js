import { Joi } from '../../core/validators/validate.js';

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getApprovalsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  status: Joi.string().max(50).optional(),
  stationId: Joi.number().integer().min(1).optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  type: Joi.string().allow('').max(50).optional(),
  sortBy: Joi.string().allow('').max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional()
});

export const rejectReasonBodySchema = Joi.object({
  reason: Joi.string().allow('').max(500).optional(),
  rejectReason: Joi.string().allow('').max(500).optional()
});

export const batchIdsBodySchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required()
});

export const batchRejectBodySchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
  reason: Joi.string().allow('').max(500).optional(),
  rejectReason: Joi.string().allow('').max(500).optional()
});

export const approveActionBodySchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  rejectReason: Joi.string().allow('').max(500).optional()
});

export const batchApproveTaskHoursBodySchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
  action: Joi.string().valid('approve', 'reject').required(),
  rejectReason: Joi.string().allow('').max(500).optional()
});

export const approveRectificationBodySchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  rejectReason: Joi.string().allow('').max(500).optional(),
  rootCauseCategory: Joi.string().allow('').max(200).optional(),
  approveComment: Joi.string().allow('').max(500).optional()
});

export default {
  idParamSchema,
  getApprovalsQuerySchema,
  rejectReasonBodySchema,
  batchIdsBodySchema,
  batchRejectBodySchema,
  approveActionBodySchema,
  batchApproveTaskHoursBodySchema,
  approveRectificationBodySchema
};
