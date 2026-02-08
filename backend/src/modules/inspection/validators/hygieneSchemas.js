import { Joi } from '../../core/validators/validate.js';

const intOrEmpty = Joi.alternatives().try(
  Joi.number().integer(),
  Joi.string().allow('')
);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const getHygieneAreasQuerySchema = Joi.object({
  stationId: intOrEmpty.optional()
});

export const createHygieneAreaBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  areaName: Joi.string().allow('').max(200).optional(),
  areaPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
  mergeMode: Joi.string().allow('').max(50).optional(),
  points: Joi.array().items(Joi.object({
    pointName: Joi.string().allow('').max(200).optional(),
    workRequirements: Joi.string().allow('').max(2000).optional()
  })).optional()
});

export const updateHygieneAreaBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  areaName: Joi.string().allow('').max(200).optional(),
  areaPoints: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const getHygienePointsQuerySchema = Joi.object({
  hygieneAreaId: intOrEmpty.optional(),
  stationId: intOrEmpty.optional()
});

export const createHygienePointBodySchema = Joi.object({
  hygieneAreaId: intOrEmpty.optional(),
  pointName: Joi.string().allow('').max(200).optional(),
  workRequirements: Joi.string().allow('').max(2000).optional()
});

export const updateHygienePointBodySchema = Joi.object({
  pointName: Joi.string().allow('').max(200).optional(),
  workRequirements: Joi.string().allow('').max(2000).optional()
});

export const getHygienePositionAreasQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional()
});

export const createHygienePositionAreaBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  hygieneAreaId: intOrEmpty.optional(),
  areaId: intOrEmpty.optional()
});

export const getHygieneAreasByPositionQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional()
});

export default {
  idParamSchema,
  getHygieneAreasQuerySchema,
  createHygieneAreaBodySchema,
  updateHygieneAreaBodySchema,
  getHygienePointsQuerySchema,
  createHygienePointBodySchema,
  updateHygienePointBodySchema,
  getHygienePositionAreasQuerySchema,
  createHygienePositionAreaBodySchema,
  getHygieneAreasByPositionQuerySchema
};

