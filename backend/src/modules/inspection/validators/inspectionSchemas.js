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

export const getSelfInspectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  stationId: intOrEmpty.optional(),
  inspectionType: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  fillerId: intOrEmpty.optional(),
  positionName: Joi.string().allow('').max(200).optional(),
  fillerName: Joi.string().allow('').max(200).optional(),
  hasAbnormal: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  hasUnqualified: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  workTypeId: intOrEmpty.optional()
});

export const createSelfInspectionBodySchema = Joi.object({
  inspectionType: Joi.string().allow('').max(50).optional(),
  stationId: intOrEmpty.optional(),
  inspectionDate: Joi.string().allow('').max(20).optional(),
  inspectionItems: jsonArrayOrText.optional(),
  photoUrls: jsonArrayOrText.optional(),
  workTypeIds: jsonArrayOrText.optional()
});

export const getMySelfInspectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  inspectionType: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  workTypeId: intOrEmpty.optional(),
  inspectionResult: Joi.string().allow('').max(50).optional(),
  merge: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  sortOrder: Joi.string().allow('').max(10).optional()
});

export const getOverdueUsersQuerySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  inspectionType: Joi.string().allow('').max(50).optional()
});

export const getOtherInspectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  stationId: intOrEmpty.optional(),
  inspectionType: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional(),
  workTypeIds: Joi.string().allow('').max(2000).optional(),
  includeSelf: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  inspectedUserName: Joi.string().allow('').max(200).optional(),
  inspectionKind: Joi.string().allow('').max(50).optional(),
  inspectionResult: Joi.string().allow('').max(50).optional(),
  sortOrder: Joi.string().allow('').max(10).optional()
});

export const createOtherInspectionBodySchema = Joi.object({
  inspectionType: Joi.string().allow('').max(50).optional(),
  stationId: intOrEmpty.optional(),
  inspectionDate: Joi.string().allow('').max(20).optional(),
  inspectedUserId: intOrEmpty.optional(),
  inspectedUserName: Joi.string().allow('').max(200).optional(),
  violationDescription: Joi.string().allow('').max(2000).optional(),
  isQualified: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  unqualifiedItems: jsonArrayOrText.optional(),
  photoUrls: jsonArrayOrText.optional(),
  projectId: intOrEmpty.optional(),
  workTypeIds: jsonArrayOrText.optional(),
  inspectionItems: jsonArrayOrText.optional(),
  remark: Joi.string().allow('').max(2000).optional(),
  points: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export const getHazardInspectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  hazardCategory: Joi.string().allow('').max(200).optional(),
  status: Joi.string().allow('').max(50).optional(),
  startDate: Joi.string().allow('').max(20).optional(),
  endDate: Joi.string().allow('').max(20).optional()
});

export const createHazardInspectionBodySchema = Joi.object({
  stationId: intOrEmpty.optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  hazardCategory: Joi.string().allow('').max(200).optional(),
  hazardDescription: Joi.string().allow('').max(5000).optional(),
  photoUrls: jsonArrayOrText.optional(),
  location: Joi.string().allow('').max(500).optional()
});

export const updateHazardInspectionBodySchema = Joi.object({
  inspectionDate: Joi.string().allow('').max(20).optional(),
  stationName: Joi.string().allow('').max(200).optional(),
  stationType: Joi.string().allow('').max(50).optional(),
  hazardCategory: Joi.string().allow('').max(200).optional(),
  hazardDescription: Joi.string().allow('').max(5000).optional(),
  photoUrls: jsonArrayOrText.optional(),
  location: Joi.string().allow('').max(500).optional()
});

export const getSafetyRectificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  pageSize: Joi.number().integer().min(1).max(5000).optional(),
  status: Joi.string().allow('').max(50).optional()
});

export const createSafetyRectificationBodySchema = Joi.object({
  inspectionId: intOrEmpty.optional(),
  rootCause: Joi.string().allow('').max(5000).optional(),
  rootCauseCategory: Joi.string().allow('').max(200).optional(),
  rectificationMeasures: Joi.string().allow('').max(5000).optional(),
  punishedPersonId: intOrEmpty.optional(),
  punishedPersonName: Joi.string().allow('').max(200).optional(),
  punishmentResult: Joi.string().allow('').max(2000).optional(),
  isCompleted: Joi.alternatives().try(Joi.boolean(), Joi.number().integer(), Joi.string().allow('')).optional(),
  completionPhotos: jsonArrayOrText.optional()
});

export const updateSafetyRectificationBodySchema = createSafetyRectificationBodySchema.keys({});

export const reviewSafetyRectificationBodySchema = Joi.object({
  reviewConfirmed: Joi.string().allow('').max(50).optional(),
  completionScore: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional()
});

export default {
  idParamSchema,
  getSelfInspectionsQuerySchema,
  createSelfInspectionBodySchema,
  getMySelfInspectionsQuerySchema,
  getOverdueUsersQuerySchema,
  getOtherInspectionsQuerySchema,
  createOtherInspectionBodySchema,
  getHazardInspectionsQuerySchema,
  createHazardInspectionBodySchema,
  updateHazardInspectionBodySchema,
  getSafetyRectificationsQuerySchema,
  createSafetyRectificationBodySchema,
  updateSafetyRectificationBodySchema,
  reviewSafetyRectificationBodySchema
};

