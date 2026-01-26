import * as hazardConfigService from '../modules/inspection/services/hazardConfigService.js';

export const getHazardCategories = hazardConfigService.getHazardCategories;
export const createHazardCategory = hazardConfigService.createHazardCategory;
export const updateHazardCategory = hazardConfigService.updateHazardCategory;
export const deleteHazardCategory = hazardConfigService.deleteHazardCategory;
export const getHazardRootCauses = hazardConfigService.getHazardRootCauses;
export const createHazardRootCause = hazardConfigService.createHazardRootCause;
export const updateHazardRootCause = hazardConfigService.updateHazardRootCause;
export const deleteHazardRootCause = hazardConfigService.deleteHazardRootCause;

export default {
  getHazardCategories,
  createHazardCategory,
  updateHazardCategory,
  deleteHazardCategory,
  getHazardRootCauses,
  createHazardRootCause,
  updateHazardRootCause,
  deleteHazardRootCause
};
