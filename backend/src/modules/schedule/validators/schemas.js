import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const getSchedulesQuerySchema = Joi.object({
  year: intOrEmpty.optional(),
  month: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  userId: intOrEmpty.optional()
});

export const getSchedulesOverviewQuerySchema = Joi.object({
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  userId: intOrEmpty.optional(),
  includeTasks: Joi.string().valid('0', '1', 'true', 'false').optional()
});

export const getMyScheduleQuerySchema = Joi.object({
  year: intOrEmpty.optional(),
  month: intOrEmpty.optional()
});

export const getTodayScheduledUsersQuerySchema = Joi.object({
  stationId: intOrEmpty.optional()
});

export const scheduleIdParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const saveScheduleBodySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  userId: Joi.number().integer().min(1).optional(),
  userName: Joi.string().allow('').max(200).optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  year: Joi.number().integer().min(2000).max(2100).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  schedules: Joi.any().optional(),
  projectId: Joi.number().integer().min(1).optional()
});

export const batchSaveSchedulesBodySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  year: Joi.number().integer().min(2000).max(2100).optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  projectId: Joi.number().integer().min(1).optional(),
  scheduleList: Joi.array().items(Joi.object({
    userId: Joi.number().integer().min(1).optional(),
    userName: Joi.string().allow('').max(200).optional(),
    positionName: Joi.string().allow('').max(200).optional(),
    schedules: Joi.any().optional()
  })).optional()
});

export const batchDeleteSchedulesBodySchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().min(1)).optional()
});

export default {
  getSchedulesQuerySchema,
  getSchedulesOverviewQuerySchema,
  getMyScheduleQuerySchema,
  getTodayScheduledUsersQuerySchema,
  scheduleIdParamSchema,
  saveScheduleBodySchema,
  batchSaveSchedulesBodySchema,
  batchDeleteSchedulesBodySchema
};
