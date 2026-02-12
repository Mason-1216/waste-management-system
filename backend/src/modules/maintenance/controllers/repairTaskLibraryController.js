import * as repairTaskLibraryService from '../services/repairTaskLibraryService.js';

export const getRepairTaskLibrary = repairTaskLibraryService.getRepairTaskLibrary;
export const createRepairTaskLibrary = repairTaskLibraryService.createRepairTaskLibrary;
export const updateRepairTaskLibrary = repairTaskLibraryService.updateRepairTaskLibrary;
export const deleteRepairTaskLibrary = repairTaskLibraryService.deleteRepairTaskLibrary;
export const batchDeleteRepairTaskLibrary = repairTaskLibraryService.batchDeleteRepairTaskLibrary;
export const importRepairTaskLibrary = repairTaskLibraryService.importRepairTaskLibrary;
export const previewImportRepairTaskLibrary = repairTaskLibraryService.previewImportRepairTaskLibrary;
export const getRepairTaskLibraryTemplate = repairTaskLibraryService.getRepairTaskLibraryTemplate;

export default {
  getRepairTaskLibrary,
  createRepairTaskLibrary,
  updateRepairTaskLibrary,
  deleteRepairTaskLibrary,
  batchDeleteRepairTaskLibrary,
  importRepairTaskLibrary,
  previewImportRepairTaskLibrary,
  getRepairTaskLibraryTemplate
};
