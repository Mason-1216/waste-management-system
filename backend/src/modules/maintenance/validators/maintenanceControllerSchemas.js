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

export const getMaintenancePlansQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  equipmentName: Joi.string().allow('').max(200).optional()
});

export const createMaintenancePlanBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  cycleType: Joi.string().allow('').max(50).optional(),
  cycleValue: intOrEmpty.optional(),
  maintenanceContent: Joi.string().allow('').max(5000).optional(),
  assignedUserId: intOrEmpty.optional(),
  assignedUserName: Joi.string().allow('').max(200).optional(),
  startDate: Joi.string().allow('').max(20).optional()
});

export const updateMaintenancePlanBodySchema = Joi.object({});

export const getMaintenanceRecordsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional()
});

export const createMaintenanceRecordBodySchema = Joi.object({
  planId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  maintenanceDate: Joi.string().allow('').max(20).optional(),
  maintenanceContent: Joi.string().allow('').max(5000).optional(),
  result: Joi.string().allow('').max(50).optional(),
  issueDescription: Joi.string().allow('').max(5000).optional(),
  handlingMeasures: Joi.string().allow('').max(5000).optional(),
  photoUrls: jsonArrayOrText.optional(),
  workHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const getFaultReportsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  reporterId: intOrEmpty.optional()
});

export const createFaultReportBodySchema = Joi.object({
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installationLocation: Joi.string().allow('').max(200).optional(),
  faultDate: Joi.string().allow('').max(20).optional(),
  faultTime: Joi.string().allow('').max(20).optional(),
  faultDescription: Joi.string().allow('').max(5000).optional(),
  stationId: intOrEmpty.optional()
});

export const assignFaultReportBodySchema = Joi.object({
  maintenanceUserId: intOrEmpty.optional()
});

export const getRepairRecordsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  stationId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional()
});

export const createRepairRecordBodySchema = Joi.object({
  faultReportId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  equipmentLocation: Joi.string().allow('').max(200).optional(),
  equipmentModel: Joi.string().allow('').max(200).optional(),
  faultDate: Joi.string().allow('').max(20).optional(),
  faultTime: Joi.string().allow('').max(20).optional(),
  faultDescription: Joi.string().allow('').max(5000).optional(),
  preliminaryJudgment: Joi.string().allow('').max(5000).optional(),
  reportDate: Joi.string().allow('').max(20).optional(),
  reportTime: Joi.string().allow('').max(20).optional(),
  urgencyLevel: Joi.string().allow('').max(50).optional(),
  isDraft: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const updateRepairRecordBodySchema = Joi.object({});

export const dispatchRepairRecordBodySchema = Joi.object({
  repairPersonId: intOrEmpty.optional(),
  repairPersonName: Joi.string().allow('').max(200).optional(),
  dispatchRemark: Joi.string().allow('').max(2000).optional()
});

export const startRepairBodySchema = Joi.object({
  startRemark: Joi.string().allow('').max(2000).optional()
});

export const completeRepairBodySchema = Joi.object({
  completionRemark: Joi.string().allow('').max(2000).optional(),
  completionPhotos: jsonArrayOrText.optional()
});

export const verifyRepairRecordBodySchema = Joi.object({
  verifyResult: Joi.string().allow('').max(50).optional(),
  verifyRemark: Joi.string().allow('').max(2000).optional(),
  deductionPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  deductionRemark: Joi.string().allow('').max(2000).optional()
});

export const createMaterialRequisitionBodySchema = Joi.object({
  repairRecordId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  materialList: jsonArrayOrText.optional()
});

export const getMaterialRequisitionsQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional()
});

export default {
  idParamSchema,
  getMaintenancePlansQuerySchema,
  createMaintenancePlanBodySchema,
  updateMaintenancePlanBodySchema,
  getMaintenanceRecordsQuerySchema,
  createMaintenanceRecordBodySchema,
  getFaultReportsQuerySchema,
  createFaultReportBodySchema,
  assignFaultReportBodySchema,
  getRepairRecordsQuerySchema,
  createRepairRecordBodySchema,
  updateRepairRecordBodySchema,
  dispatchRepairRecordBodySchema,
  startRepairBodySchema,
  completeRepairBodySchema,
  verifyRepairRecordBodySchema,
  createMaterialRequisitionBodySchema,
  getMaterialRequisitionsQuerySchema
};

