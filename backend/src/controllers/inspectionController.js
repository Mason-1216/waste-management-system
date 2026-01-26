import * as inspectionService from '../modules/inspection/services/inspectionService.js';

export const getSelfInspections = inspectionService.getSelfInspections;
export const createSelfInspection = inspectionService.createSelfInspection;
export const getMySelfInspections = inspectionService.getMySelfInspections;
export const getOverdueUsers = inspectionService.getOverdueUsers;
export const getOtherInspections = inspectionService.getOtherInspections;
export const createOtherInspection = inspectionService.createOtherInspection;
export const getHazardInspections = inspectionService.getHazardInspections;
export const createHazardInspection = inspectionService.createHazardInspection;
export const updateHazardInspection = inspectionService.updateHazardInspection;
export const deleteHazardInspection = inspectionService.deleteHazardInspection;
export const getSafetyRectifications = inspectionService.getSafetyRectifications;
export const createSafetyRectification = inspectionService.createSafetyRectification;
export const updateSafetyRectification = inspectionService.updateSafetyRectification;
export const reviewSafetyRectification = inspectionService.reviewSafetyRectification;

export default {
  getSelfInspections,
  createSelfInspection,
  getMySelfInspections,
  getOverdueUsers,
  getOtherInspections,
  createOtherInspection,
  getHazardInspections,
  createHazardInspection,
  updateHazardInspection,
  deleteHazardInspection,
  getSafetyRectifications,
  createSafetyRectification,
  updateSafetyRectification,
  reviewSafetyRectification
};
