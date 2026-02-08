import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getRepairTaskLibraryQuerySchema = Joi.object({
  page: intOrEmpty.optional(),
  pageSize: intOrEmpty.optional(),
  sortBy: Joi.string().allow('').max(100).optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),

  taskName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional(),
  keyword: Joi.string().allow('').max(200).optional(),
  isActive: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const createRepairTaskLibraryBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  quantity: intOrEmpty.optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  pointsRule: Joi.string().allow('').max(2000).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional()
});

export const updateRepairTaskLibraryBodySchema = Joi.object({
  taskName: Joi.string().allow('').max(200).optional(),
  taskCategory: Joi.string().allow('').max(200).optional(),
  scoreMethod: Joi.string().allow('').max(50).optional(),
  quantity: intOrEmpty.optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  pointsRule: Joi.string().allow('').max(2000).optional(),
  quantityEditable: intOrEmpty.optional(),
  pointsEditable: intOrEmpty.optional(),
  isActive: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const batchDeleteRepairTaskLibraryBodySchema = Joi.object({
  ids: Joi.array().items(intOrEmpty).optional()
});

export default {
  idParamSchema,
  getRepairTaskLibraryQuerySchema,
  createRepairTaskLibraryBodySchema,
  updateRepairTaskLibraryBodySchema,
  batchDeleteRepairTaskLibraryBodySchema
};

