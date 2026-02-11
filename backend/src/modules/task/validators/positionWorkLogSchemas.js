import { Joi } from '../../core/validators/validate.js';
import { TASK_CATEGORY_OPTIONS } from '../../../utils/taskCategory.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getTodayTasksQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  workDate: Joi.string().allow('').max(20).optional()
});

export const saveWorkLogBodySchema = Joi.object({
  logId: intOrEmpty.optional(),
  positionJobId: intOrEmpty.optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  workName: Joi.string().allow('').max(200).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  actualHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  isCompleted: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  progress: intOrEmpty.optional(),
  remark: Joi.string().allow('').max(2000).optional(),
  quantity: intOrEmpty.optional(),
  unitPoints: intOrEmpty.optional(),
  taskSource: Joi.string().allow('').max(50).optional()
});

export const applyWorkLogBodySchema = Joi.object({
  positionJobId: intOrEmpty.optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  quantity: intOrEmpty.optional(),
  remark: Joi.string().allow('').max(2000).optional()
});

export const dispatchWorkLogBodySchema = Joi.object({
  positionJobId: intOrEmpty.optional(),
  executorId: intOrEmpty.optional(),
  executorName: Joi.string().allow('').max(200).optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  quantity: intOrEmpty.optional()
});

export const getWorkLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  taskSource: Joi.string().allow('').max(50).optional(),
  reviewStatus: Joi.string().allow('').max(50).optional()
});

export const getUserWorkLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  userId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  taskSource: Joi.string().allow('').max(50).optional()
});

export const getWorkRecordsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),

  keyword: Joi.string().allow('').max(200).optional(),
  taskSource: Joi.string().allow('').max(50).optional(),
  reviewStatus: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  submitStartDate: Joi.string().allow('').max(20).optional(),
  submitEndDate: Joi.string().allow('').max(20).optional(),
  approveStartDate: Joi.string().allow('').max(20).optional(),
  approveEndDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  userName: Joi.string().allow('').max(200).optional(),
  workName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().allow('').valid('', ...TASK_CATEGORY_OPTIONS).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  unitPoints: intOrEmpty.optional(),
  quantity: intOrEmpty.optional(),
  calculatedPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  isCompleted: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  approverName: Joi.string().allow('').max(200).optional(),
  deductionReason: Joi.string().allow('').max(500).optional(),
  deductionPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const reviewWorkLogBodySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional(),
  deductionReason: Joi.string().allow('').max(500).optional(),
  deductionPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const submitAppealBodySchema = Joi.object({
  appealReason: Joi.string().allow('').max(2000).optional()
});

export default {
  idParamSchema,
  getTodayTasksQuerySchema,
  saveWorkLogBodySchema,
  applyWorkLogBodySchema,
  dispatchWorkLogBodySchema,
  getWorkLogsQuerySchema,
  getUserWorkLogsQuerySchema,
  getWorkRecordsQuerySchema,
  reviewWorkLogBodySchema,
  submitAppealBodySchema
};

