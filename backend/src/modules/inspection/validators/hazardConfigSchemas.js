import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getHazardCategoriesQuerySchema = Joi.object({
  status: intOrEmpty.optional()
});

export const createHazardCategoryBodySchema = Joi.object({
  categoryName: Joi.string().allow('').max(200).optional()
});

export const updateHazardCategoryBodySchema = Joi.object({
  categoryName: Joi.string().allow('').max(200).optional(),
  sortOrder: intOrEmpty.optional(),
  status: intOrEmpty.optional()
});

export const getHazardRootCausesQuerySchema = Joi.object({
  status: intOrEmpty.optional()
});

export const createHazardRootCauseBodySchema = Joi.object({
  causeName: Joi.string().allow('').max(200).optional()
});

export const updateHazardRootCauseBodySchema = Joi.object({
  causeName: Joi.string().allow('').max(200).optional(),
  sortOrder: intOrEmpty.optional(),
  status: intOrEmpty.optional()
});

export default {
  idParamSchema,
  getHazardCategoriesQuerySchema,
  createHazardCategoryBodySchema,
  updateHazardCategoryBodySchema,
  getHazardRootCausesQuerySchema,
  createHazardRootCauseBodySchema,
  updateHazardRootCauseBodySchema
};

