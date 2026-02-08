import { Joi } from '../../core/validators/validate.js';

export const dateRangeStationQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional()
});

export const workHoursReportQuerySchema = dateRangeStationQuerySchema.keys({
  groupBy: Joi.string().valid('user', 'task', 'date').optional()
});

export const scheduleReportQuerySchema = dateRangeStationQuerySchema.keys({
  userId: Joi.number().integer().min(1).optional(),
  includeTasks: Joi.string().valid('0', '1', 'true', 'false').optional()
});

export const temporaryTasksReportQuerySchema = dateRangeStationQuerySchema.keys({
  userId: Joi.number().integer().min(1).optional(),
  userName: Joi.string().allow('').max(200).optional()
});

export const pointsSummaryReportQuerySchema = dateRangeStationQuerySchema.keys({
  userName: Joi.string().allow('').max(200).optional()
});

export const byMonthQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  year: Joi.number().integer().min(2000).max(2100).optional()
});

export default {
  dateRangeStationQuerySchema,
  workHoursReportQuerySchema,
  scheduleReportQuerySchema,
  temporaryTasksReportQuerySchema,
  pointsSummaryReportQuerySchema,
  byMonthQuerySchema
};
