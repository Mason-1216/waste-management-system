import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getTaskConfigsQuerySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional()
});

export const createTaskConfigBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const updateTaskConfigBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  status: Joi.string().allow('').max(50).optional()
});

export const getPositionTasksQuerySchema = Joi.object({
  positionName: Joi.string().allow('').max(200).optional()
});

export const savePositionTasksBodySchema = Joi.object({
  positionName: Joi.string().allow('').max(200).optional(),
  tasks: Joi.array().items(Joi.object({
    taskConfigId: Joi.number().integer().min(1).optional(),
    isRequired: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
  })).optional()
});

export const getDailyTasksQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  userId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  status: Joi.string().allow('').max(50).optional()
});

export const getMyDailyTasksQuerySchema = Joi.object({
  workDate: Joi.string().allow('').max(20).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional()
});

export const submitDailyTasksBodySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  workDate: Joi.string().allow('').max(20).optional(),
  tasks: Joi.array().items(Joi.object({
    taskConfigId: Joi.number().integer().min(1).optional(),
    times: Joi.number().integer().min(1).optional(),
    isFixedTask: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
  })).optional()
});

export const getDailyTaskSummaryQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  userId: intOrEmpty.optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  groupBy: Joi.string().allow('').max(50).optional()
});

export const getTemporaryTasksQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  executorId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  taskType: Joi.string().allow('').max(50).optional(),
  taskName: Joi.string().allow('').max(200).optional(),
  assigneeName: Joi.string().allow('').max(200).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  stationId: intOrEmpty.optional()
});

export const createTemporaryTaskBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  taskDescription: Joi.string().allow('').max(2000).optional(),
  taskType: Joi.string().allow('').max(50).optional(),
  executorId: Joi.number().integer().min(1).optional(),
  executorName: Joi.string().allow('').max(200).optional(),
  stationId: Joi.number().integer().min(1).optional(),
  planStartTime: Joi.string().allow('').max(30).optional(),
  planEndTime: Joi.string().allow('').max(30).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  unitPoints: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional(),
  unitPointsEditable: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  quantity: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional(),
  points: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional()
});

export const updateTemporaryTaskBodySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional(),
  actualHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  completionNote: Joi.string().allow('').max(2000).optional()
});

export const submitTemporaryTaskBodySchema = Joi.object({
  actualHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  completionNote: Joi.string().allow('').max(2000).optional(),
  isCompleted: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  unitPoints: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional(),
  quantity: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional()
});

export const reviewTemporaryTaskBodySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional(),
  deductionReason: Joi.string().allow('').max(500).optional(),
  deductionPoints: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional()
});

export default {
  idParamSchema,
  getTaskConfigsQuerySchema,
  createTaskConfigBodySchema,
  updateTaskConfigBodySchema,
  getPositionTasksQuerySchema,
  savePositionTasksBodySchema,
  getDailyTasksQuerySchema,
  getMyDailyTasksQuerySchema,
  submitDailyTasksBodySchema,
  getDailyTaskSummaryQuerySchema,
  getTemporaryTasksQuerySchema,
  createTemporaryTaskBodySchema,
  updateTemporaryTaskBodySchema,
  submitTemporaryTaskBodySchema,
  reviewTemporaryTaskBodySchema
};
