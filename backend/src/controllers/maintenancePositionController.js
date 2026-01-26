import * as positionService from '../modules/maintenance/services/positionService.js';

export const getMaintenancePositionPlans = positionService.getMaintenancePositionPlans;
export const createMaintenancePositionPlan = positionService.createMaintenancePositionPlan;
export const deleteMaintenancePositionPlan = positionService.deleteMaintenancePositionPlan;
export const getMaintenanceWorkRecords = positionService.getMaintenanceWorkRecords;
export const getMaintenanceWorkRecordDetail = positionService.getMaintenanceWorkRecordDetail;
export const submitMaintenanceWorkRecord = positionService.submitMaintenanceWorkRecord;
export const getTodayMaintenanceTasks = positionService.getTodayMaintenanceTasks;
export const verifyMaintenanceWorkRecord = positionService.verifyMaintenanceWorkRecord;

export default {
  getMaintenancePositionPlans,
  createMaintenancePositionPlan,
  deleteMaintenancePositionPlan,
  getMaintenanceWorkRecords,
  getMaintenanceWorkRecordDetail,
  submitMaintenanceWorkRecord,
  getTodayMaintenanceTasks,
  verifyMaintenanceWorkRecord
};
