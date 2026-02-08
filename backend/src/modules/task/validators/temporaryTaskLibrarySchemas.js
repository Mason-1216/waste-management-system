import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getTemporaryTaskLibraryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  stationId: intOrEmpty.optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  quantityEditable: intOrEmpty.optional(),
  dispatchReviewRequired: intOrEmpty.optional()
});

export const createTemporaryTaskLibraryBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  taskContent: Joi.string().allow('').max(2000).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  unitPoints: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('')).optional(),
  quantity: intOrEmpty.optional(),
  pointsRule: Joi.string().allow('').max(2000).optional(),
  unitPointsEditable: intOrEmpty.optional(),
  quantityEditable: intOrEmpty.optional(),
  dispatchReviewRequired: intOrEmpty.optional(),
  stationId: intOrEmpty.optional()
});

export const updateTemporaryTaskLibraryBodySchema = createTemporaryTaskLibraryBodySchema.keys({});

export const batchImportTemporaryTaskLibraryBodySchema = Joi.object({
  tasks: Joi.array().items(Joi.object({
    taskName: Joi.string().allow('').max(200).optional(),
    taskContent: Joi.string().allow('').max(2000).optional(),
    taskCategory: Joi.string().allow('').max(200).optional(),
    scoreMethod: Joi.string().allow('').max(50).optional(),
    standardHours: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
    unitPoints: intOrEmpty.optional(),
    quantity: intOrEmpty.optional(),
    pointsRule: Joi.string().allow('').max(2000).optional(),
    unitPointsEditable: intOrEmpty.optional(),
    quantityEditable: intOrEmpty.optional(),
    dispatchReviewRequired: intOrEmpty.optional(),
    stationId: intOrEmpty.optional()
  })).optional()
});

export default {
  idParamSchema,
  getTemporaryTaskLibraryQuerySchema,
  createTemporaryTaskLibraryBodySchema,
  updateTemporaryTaskLibraryBodySchema,
  batchImportTemporaryTaskLibraryBodySchema
};

