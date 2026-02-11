import { Joi } from '../../core/validators/validate.js';

export const dateRangeStationQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  // Expect YYYY-MM-DD (or empty). Prevent values like "Invalid Date" reaching SQL filters.
  startDate: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/).max(20).optional(),
  endDate: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/).max(20).optional()
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
  userName: Joi.string().allow('').max(200).optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  cycle: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).optional()
});

export const pointsDetailsReportQuerySchema = dateRangeStationQuerySchema.keys({
  keyword: Joi.string().allow('').max(200).optional(),
  userId: Joi.number().integer().min(1).optional(),
  taskName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().valid('all', 'Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类').optional(),
  category: Joi.string().valid('all', 'safety', 'hygiene', 'repair', 'maintenance', 'fixed', 'dispatch', 'selfApply', 'deduction').optional(),
  dataSource: Joi.string().valid('all', 'summary', 'manual').optional(),
  cycle: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).optional()
});

export const pointsSummaryDrilldownQuerySchema = dateRangeStationQuerySchema.keys({
  userId: Joi.number().integer().min(1).required(),
  category: Joi.string().valid('safety', 'hygiene', 'repair', 'maintenance', 'fixed', 'dispatch', 'selfApply', 'deduction').required(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).optional()
});

export const pointsTaskCategorySummaryQuerySchema = dateRangeStationQuerySchema.keys({
  keyword: Joi.string().allow('').max(200).optional(),
  cycle: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).optional()
});

export const byMonthQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  year: Joi.number().integer().min(2000).max(2100).optional()
});

export const appliedHourlyPointsQuerySchema = Joi.object({
  endMonth: Joi.string().allow('').max(20).optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).optional()
});

export const manualWorkHoursListQuerySchema = Joi.object({
  startMonth: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}$/).max(10).optional(),
  endMonth: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}$/).max(10).optional(),
  userName: Joi.string().allow('').max(200).optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional()
});

export const manualWorkHourUpdateSchema = Joi.object({
  workMonth: Joi.string().trim().pattern(/^\d{4}-\d{2}$/).max(10).required(),
  workHours: Joi.number().min(0).required(),
  remark: Joi.string().allow('', null).max(500).optional()
});

export const pointsCycleAnalysisQuerySchema = Joi.object({
  startDate: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/).max(20).optional(),
  endDate: Joi.string().trim().allow('').pattern(/^\d{4}-\d{2}-\d{2}$/).max(20).optional(),
  keyword: Joi.string().allow('').max(200).optional()
});

export default {
  dateRangeStationQuerySchema,
  workHoursReportQuerySchema,
  scheduleReportQuerySchema,
  temporaryTasksReportQuerySchema,
  pointsSummaryReportQuerySchema,
  pointsDetailsReportQuerySchema,
  pointsSummaryDrilldownQuerySchema,
  pointsTaskCategorySummaryQuerySchema,
  appliedHourlyPointsQuerySchema,
  byMonthQuerySchema,
  manualWorkHoursListQuerySchema,
  manualWorkHourUpdateSchema,
  pointsCycleAnalysisQuerySchema
};
