import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getPositionJobsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),

  positionName: Joi.string().allow('').max(200).optional(),
  stationId: intOrEmpty.optional(),
  jobName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  quantity: intOrEmpty.optional(),
  pointsRule: Joi.string().allow('').max(500).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional(),
  dispatchReviewRequired: intOrEmpty.optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  isActive: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const createPositionJobBodySchema = Joi.object({
  positionName: Joi.string().allow('').max(200).optional(),
  jobName: Joi.string().allow('').max(200).optional(),
  resultDefinition: Joi.string().allow('').max(2000).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  quantity: intOrEmpty.optional(),
  pointsRule: Joi.string().allow('').max(2000).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional(),
  dispatchReviewRequired: intOrEmpty.optional(),
  sortOrder: intOrEmpty.optional(),
  stationId: intOrEmpty.optional()
});

export const updatePositionJobBodySchema = Joi.object({
  positionName: Joi.string().allow('').max(200).optional(),
  jobName: Joi.string().allow('').max(200).optional(),
  resultDefinition: Joi.string().allow('').max(2000).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  quantity: intOrEmpty.optional(),
  pointsRule: Joi.string().allow('').max(2000).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional(),
  dispatchReviewRequired: intOrEmpty.optional(),
  sortOrder: intOrEmpty.optional(),
  stationId: intOrEmpty.optional(),
  isActive: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  renamePosition: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const deletePositionJobQuerySchema = Joi.object({
  confirmed: Joi.alternatives().try(Joi.boolean(), Joi.string().allow('')).optional()
});

export const getPositionJobsByPositionQuerySchema = Joi.object({
  positionName: Joi.string().allow('').max(200).optional(),
  stationId: intOrEmpty.optional()
});

export const getPositionNamesQuerySchema = Joi.object({
  stationId: intOrEmpty.optional()
});

export default {
  idParamSchema,
  getPositionJobsQuerySchema,
  createPositionJobBodySchema,
  updatePositionJobBodySchema,
  deletePositionJobQuerySchema,
  getPositionJobsByPositionQuerySchema,
  getPositionNamesQuerySchema
};

