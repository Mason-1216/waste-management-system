import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow(''),
  Joi.valid(null)
);

const jsonArrayOrText = Joi.alternatives().try(
  Joi.array(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getMaintenancePlanLibraryQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  keyword: Joi.string().allow('').max(200).optional()
});

export const createMaintenancePlanLibraryBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installLocation: Joi.string().allow('').max(200).optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  maintenanceStandards: jsonArrayOrText.optional(),
  weeklyDay: intOrEmpty.optional(),
  monthlyDay: intOrEmpty.optional(),
  yearlyMonth: intOrEmpty.optional(),
  yearlyDay: intOrEmpty.optional()
});

export const updateMaintenancePlanLibraryBodySchema = createMaintenancePlanLibraryBodySchema.keys({});

export const batchImportMaintenancePlanLibraryBodySchema = Joi.object({
  plans: Joi.array().items(Joi.object({
    stationId: intOrEmpty.optional(),
    stationName: Joi.string().allow('').max(200).optional(),
    equipmentCode: Joi.string().allow('').max(200).optional(),
    equipmentName: Joi.string().allow('').max(200).optional(),
    installLocation: Joi.string().allow('').max(200).optional(),
    cycleType: Joi.string().allow('').max(50).optional(),
    maintenanceStandards: jsonArrayOrText.optional(),
    weeklyDay: intOrEmpty.optional(),
    monthlyDay: intOrEmpty.optional(),
    yearlyMonth: intOrEmpty.optional(),
    yearlyDay: intOrEmpty.optional()
  })).optional()
});

export const getMaintenanceAssignmentsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  executorId: intOrEmpty.optional()
});

export const createMaintenanceAssignmentBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  planId: intOrEmpty.optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installLocation: Joi.string().allow('').max(200).optional(),
  executorId: intOrEmpty.optional(),
  executorName: Joi.string().allow('').max(200).optional(),
  assignerName: Joi.string().allow('').max(200).optional(),
  planStartDate: Joi.string().allow('').max(20).optional(),
  planEndDate: Joi.string().allow('').max(20).optional(),
  planStartTime: Joi.string().allow('').max(20).optional(),
  planEndTime: Joi.string().allow('').max(20).optional()
});

export const updateMaintenanceAssignmentBodySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional(),
  actualStartDate: Joi.string().allow('').max(30).optional(),
  actualStartTime: Joi.string().allow('').max(30).optional(),
  actualEndDate: Joi.string().allow('').max(30).optional(),
  actualEndTime: Joi.string().allow('').max(30).optional(),
  completionNote: Joi.string().allow('').max(2000).optional(),
  workHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  maintenanceItems: jsonArrayOrText.optional(),
  maintenanceContent: Joi.string().allow('').max(5000).optional(),
  maintenanceTools: Joi.string().allow('').max(2000).optional(),
  maintenanceResult: Joi.string().allow('').max(2000).optional(),
  observeDays: intOrEmpty.optional(),
  unsolvedReason: Joi.string().allow('').max(2000).optional(),
  consumablesList: jsonArrayOrText.optional(),
  partsList: jsonArrayOrText.optional()
});

export const completeMaintenanceAssignmentBodySchema = Joi.object({
  completionNote: Joi.string().allow('').max(2000).optional(),
  workHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  actualEndDate: Joi.string().allow('').max(30).optional(),
  actualEndTime: Joi.string().allow('').max(30).optional(),
  maintenanceContent: Joi.string().allow('').max(5000).optional(),
  maintenanceTools: Joi.string().allow('').max(2000).optional(),
  consumablesList: jsonArrayOrText.optional(),
  partsList: jsonArrayOrText.optional()
});

export const verifyMaintenanceAssignmentBodySchema = Joi.object({
  result: Joi.string().allow('').max(50).optional(),
  verifyComment: Joi.string().allow('').max(2000).optional(),
  verifySafety: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  verifyQuality: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  verifyProgress: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  verifyHygiene: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export default {
  idParamSchema,
  getMaintenancePlanLibraryQuerySchema,
  createMaintenancePlanLibraryBodySchema,
  updateMaintenancePlanLibraryBodySchema,
  batchImportMaintenancePlanLibraryBodySchema,
  getMaintenanceAssignmentsQuerySchema,
  createMaintenanceAssignmentBodySchema,
  updateMaintenanceAssignmentBodySchema,
  completeMaintenanceAssignmentBodySchema,
  verifyMaintenanceAssignmentBodySchema
};
