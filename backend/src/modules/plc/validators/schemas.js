import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const plcRecordsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(200).optional(),
  stationId: intOrEmpty.optional(),
  scaleId: Joi.string().allow('').max(200).optional(),
  vehicleNo: Joi.string().allow('').max(200).optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional()
});

export const plcRealtimeQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional()
});

export const plcHistoryQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  configId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(200).optional()
});

export const plcConfigsQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  isActive: Joi.string().valid('true', 'false', '0', '1').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(200).optional()
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const plcMonitorConfigBodySchema = Joi.object({
  name: Joi.string().allow('').max(200).optional(),
  stationId: Joi.number().integer().min(1).optional(),
  plcIp: Joi.string().allow('').max(100).optional(),
  dbNumber: Joi.number().integer().min(0).optional(),
  offsetAddress: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  dataType: Joi.string().allow('').max(50).optional(),
  categoryId: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().allow('')).optional(),
  unit: Joi.string().allow('').max(50).optional(),
  description: Joi.string().allow('').max(500).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().optional()
});

export const plcCategoryQuerySchema = Joi.object({
  isEnabled: Joi.string().valid('true', 'false', '0', '1').optional()
});

export const plcCategoryBodySchema = Joi.object({
  categoryKey: Joi.string().allow('').max(100).optional(),
  categoryName: Joi.string().allow('').max(200).optional(),
  dataType: Joi.string().allow('').max(50).optional(),
  valueType: Joi.string().allow('').max(50).optional(),
  scheduleType: Joi.string().allow('').max(50).optional(),
  intervalHours: Joi.number().integer().min(0).optional(),
  intervalMinutes: Joi.number().integer().min(0).max(59).optional(),
  fixedTime: Joi.string().allow('').max(20).optional(),
  isEnabled: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().optional()
});

export const plcExportReportQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  format: Joi.string().allow('').max(10).optional()
});

export const plcWriteValueBodySchema = Joi.object({
  configId: Joi.number().integer().min(1).optional(),
  value: Joi.any().optional()
});

export const plcReportStatsQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  configId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  groupBy: Joi.string().valid('hour', 'day').optional()
});

export const plcHistorySummaryQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  categoryKey: Joi.string().allow('').max(100).optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  timeType: Joi.string().valid('day', 'month', 'year').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(200).optional()
});

export const plcTrendsQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  groupBy: Joi.string().valid('day', 'month', 'year').optional(),
  categories: Joi.string().allow('').max(500).optional()
});

export const plcCumulativeQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  categoryId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(30).optional(),
  endDate: Joi.string().allow('').max(30).optional(),
  timeGranularity: Joi.string().valid('day', 'week', 'month', 'year').optional(),
  groupBy: Joi.string().valid('address', 'station', 'category').optional(),
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(200).optional()
});

export const plcFluctuatingQuerySchema = plcCumulativeQuerySchema;

export default {
  plcRecordsQuerySchema,
  plcRealtimeQuerySchema,
  plcHistoryQuerySchema,
  plcConfigsQuerySchema,
  idParamSchema,
  plcMonitorConfigBodySchema,
  plcCategoryQuerySchema,
  plcCategoryBodySchema,
  plcExportReportQuerySchema,
  plcWriteValueBodySchema,
  plcReportStatsQuerySchema,
  plcHistorySummaryQuerySchema,
  plcTrendsQuerySchema,
  plcCumulativeQuerySchema,
  plcFluctuatingQuerySchema
};
