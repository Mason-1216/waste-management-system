import { Joi } from '../../core/validators/validate.js';

export const getEquipmentQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).optional(),
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installationLocation: Joi.string().allow('').max(200).optional()
});

export const getEquipmentByCodeQuerySchema = Joi.object({
  stationId: Joi.number().integer().min(1).required(),
  equipmentCode: Joi.string().trim().min(1).max(200).required()
});

export const equipmentIdParamSchema = Joi.object({
  id: Joi.number().integer().min(1).required()
});

export const createEquipmentBodySchema = Joi.object({
  stationId: Joi.number().integer().min(1).required(),
  equipmentCode: Joi.string().trim().min(1).max(200).required(),
  equipmentName: Joi.string().trim().min(1).max(200).required(),
  installationLocation: Joi.string().trim().min(1).max(200).required(),
  specification: Joi.string().allow('').max(500).optional(),
  model: Joi.string().allow('').max(200).optional(),
  material: Joi.string().allow('').max(200).optional()
});

export const batchCreateEquipmentBodySchema = Joi.object({
  list: Joi.array().items(createEquipmentBodySchema).min(1).required()
});

export const updateEquipmentBodySchema = Joi.object({
  equipmentCode: Joi.string().allow('').max(200).optional(),
  equipmentName: Joi.string().allow('').max(200).optional(),
  installationLocation: Joi.string().allow('').max(200).optional(),
  specification: Joi.string().allow('').max(500).optional(),
  model: Joi.string().allow('').max(200).optional(),
  material: Joi.string().allow('').max(200).optional()
});

export default {
  getEquipmentQuerySchema,
  getEquipmentByCodeQuerySchema,
  equipmentIdParamSchema,
  createEquipmentBodySchema,
  batchCreateEquipmentBodySchema,
  updateEquipmentBodySchema
};
