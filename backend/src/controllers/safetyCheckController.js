import * as safetyCheckService from '../modules/inspection/services/safetyCheckService.js';

export const getWorkTypes = safetyCheckService.getWorkTypes;
export const createWorkType = safetyCheckService.createWorkType;
export const updateWorkType = safetyCheckService.updateWorkType;
export const deleteWorkType = safetyCheckService.deleteWorkType;
export const getCheckItems = safetyCheckService.getCheckItems;
export const createCheckItem = safetyCheckService.createCheckItem;
export const batchCreateCheckItems = safetyCheckService.batchCreateCheckItems;
export const updateCheckItem = safetyCheckService.updateCheckItem;
export const deleteCheckItem = safetyCheckService.deleteCheckItem;
export const getCheckItemsByWorkTypes = safetyCheckService.getCheckItemsByWorkTypes;
export const getCheckItemsTemplate = safetyCheckService.getCheckItemsTemplate;
export const importCheckItems = safetyCheckService.importCheckItems;

export default {
  getWorkTypes,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  getCheckItems,
  createCheckItem,
  batchCreateCheckItems,
  updateCheckItem,
  deleteCheckItem,
  getCheckItemsByWorkTypes,
  getCheckItemsTemplate,
  importCheckItems
};
