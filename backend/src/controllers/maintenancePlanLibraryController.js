import * as planLibraryService from '../modules/maintenance/services/planLibraryService.js';

export const getMaintenancePlanLibrary = planLibraryService.getMaintenancePlanLibrary;
export const createMaintenancePlanLibrary = planLibraryService.createMaintenancePlanLibrary;
export const updateMaintenancePlanLibrary = planLibraryService.updateMaintenancePlanLibrary;
export const deleteMaintenancePlanLibrary = planLibraryService.deleteMaintenancePlanLibrary;
export const batchImportMaintenancePlanLibrary = planLibraryService.batchImportMaintenancePlanLibrary;
export const getMaintenanceAssignments = planLibraryService.getMaintenanceAssignments;
export const createMaintenanceAssignment = planLibraryService.createMaintenanceAssignment;
export const updateMaintenanceAssignment = planLibraryService.updateMaintenanceAssignment;
export const deleteMaintenanceAssignment = planLibraryService.deleteMaintenanceAssignment;
export const startMaintenanceAssignment = planLibraryService.startMaintenanceAssignment;
export const completeMaintenanceAssignment = planLibraryService.completeMaintenanceAssignment;
export const verifyMaintenanceAssignment = planLibraryService.verifyMaintenanceAssignment;

export default {
  getMaintenancePlanLibrary,
  createMaintenancePlanLibrary,
  updateMaintenancePlanLibrary,
  deleteMaintenancePlanLibrary,
  batchImportMaintenancePlanLibrary,
  getMaintenanceAssignments,
  createMaintenanceAssignment,
  updateMaintenanceAssignment,
  deleteMaintenanceAssignment,
  startMaintenanceAssignment,
  completeMaintenanceAssignment,
  verifyMaintenanceAssignment
};
