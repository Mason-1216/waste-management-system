import { Joi } from '../../core/validators/validate.js';

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  isRead: Joi.string().valid('0', '1', 'true', 'false').optional(),
  notifyType: Joi.string().max(50).optional(),
  notifyTypes: Joi.string().max(500).optional(),
  relatedType: Joi.string().max(50).optional(),
  relatedTypes: Joi.string().max(500).optional()
});

export const notificationIdParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const markByFilterQuerySchema = Joi.object({
  notifyType: Joi.string().max(50).optional(),
  notifyTypes: Joi.string().max(500).optional(),
  relatedType: Joi.string().max(50).optional(),
  relatedTypes: Joi.string().max(500).optional()
});

export default {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  markByFilterQuerySchema
};
