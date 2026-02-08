import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getWorkTypesQuerySchema = Joi.object({
  status: Joi.string().allow('').max(50).optional(),
  includeItems: Joi.string().allow('').max(10).optional()
});

export const createWorkTypeBodySchema = Joi.object({
  workTypeName: Joi.string().allow('').max(200).optional(),
  isDefault: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  sortOrder: intOrEmpty.optional(),
  points: intOrEmpty.optional()
});

export const updateWorkTypeBodySchema = Joi.object({
  workTypeName: Joi.string().allow('').max(200).optional(),
  isDefault: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  sortOrder: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  points: intOrEmpty.optional()
});

export const getCheckItemsQuerySchema = Joi.object({
  workTypeId: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional()
});

export const createCheckItemBodySchema = Joi.object({
  workTypeId: intOrEmpty.optional(),
  itemName: Joi.string().allow('').max(500).optional(),
  itemStandard: Joi.string().allow('').max(2000).optional(),
  sortOrder: intOrEmpty.optional(),
  parentId: intOrEmpty.optional(),
  enableChildren: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  triggerValue: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  status: Joi.string().allow('').max(50).optional()
});

export const batchCreateCheckItemsBodySchema = Joi.object({
  workTypeId: intOrEmpty.optional(),
  items: Joi.array().items(Joi.object({
    itemName: Joi.string().allow('').max(500).optional(),
    itemStandard: Joi.string().allow('').max(2000).optional(),
    sortOrder: intOrEmpty.optional(),
    parentId: intOrEmpty.optional(),
    enableChildren: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
    triggerValue: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
    status: Joi.string().allow('').max(50).optional()
  })).optional()
});

export const updateCheckItemBodySchema = Joi.object({
  itemName: Joi.string().allow('').max(500).optional(),
  itemStandard: Joi.string().allow('').max(2000).optional(),
  sortOrder: intOrEmpty.optional(),
  status: Joi.string().allow('').max(50).optional(),
  parentId: intOrEmpty.optional(),
  enableChildren: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  triggerValue: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional()
});

export const getCheckItemsByWorkTypesQuerySchema = Joi.object({
  workTypeIds: Joi.string().allow('').max(2000).optional()
});

export default {
  idParamSchema,
  getWorkTypesQuerySchema,
  createWorkTypeBodySchema,
  updateWorkTypeBodySchema,
  getCheckItemsQuerySchema,
  createCheckItemBodySchema,
  batchCreateCheckItemsBodySchema,
  updateCheckItemBodySchema,
  getCheckItemsByWorkTypesQuerySchema
};

