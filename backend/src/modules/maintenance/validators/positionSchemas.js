import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

const jsonArrayOrText = Joi.alternatives().try(
  Joi.array(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getMaintenancePositionPlansQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installLocation: Joi.string().allow('').max(200).optional(),
  cycleType: Joi.string().allow('').max(50).optional()
});

export const createMaintenancePositionPlanBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  planIds: Joi.array().items(intOrEmpty).optional()
});

export const batchImportMaintenancePositionPlansBodySchema = Joi.object({
  rows: Joi.array().items(
    Joi.object({
      rowNum: intOrEmpty.optional(),
      stationId: intOrEmpty.optional(),
      stationName: Joi.string().allow('').max(200).optional(),
      positionName: Joi.string().allow('').max(200).optional(),
      equipmentCode: Joi.string().allow('').max(200).optional()
    })
  ).min(1).required()
});

export const getTodayMaintenanceTasksQuerySchema = Joi.object({
  userId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  workDate: Joi.string().allow('').max(20).optional()
});

export const submitMaintenanceWorkRecordBodySchema = Joi.object({
  planId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installLocation: Joi.string().allow('').max(200).optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  maintenanceItems: jsonArrayOrText.optional(),
  maintenanceTools: Joi.string().allow('').max(2000).optional(),
  workHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  consumablesList: jsonArrayOrText.optional(),
  partsList: jsonArrayOrText.optional(),
  remark: Joi.string().allow('').max(2000).optional()
});

export const getMaintenanceWorkRecordsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  executorName: Joi.string().allow('').max(200).optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  status: Joi.string().allow('').max(50).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional()
});

export const verifyMaintenanceWorkRecordBodySchema = Joi.object({
  verifyResult: Joi.string().allow('').max(50).optional(),
  verifyRemark: Joi.string().allow('').max(2000).optional(),
  deductionPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  deductionRemark: Joi.string().allow('').max(2000).optional()
});

export default {
  idParamSchema,
  getMaintenancePositionPlansQuerySchema,
  createMaintenancePositionPlanBodySchema,
  batchImportMaintenancePositionPlansBodySchema,
  getTodayMaintenanceTasksQuerySchema,
  submitMaintenanceWorkRecordBodySchema,
  getMaintenanceWorkRecordsQuerySchema,
  verifyMaintenanceWorkRecordBodySchema
};
