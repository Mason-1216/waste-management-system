import * as positionWorkLogService from '../modules/task/services/positionWorkLogService.js';

export const getTodayTasks = positionWorkLogService.getTodayTasks;
export const getUserWorkLogs = positionWorkLogService.getUserWorkLogs;
export const getWorkRecords = positionWorkLogService.getWorkRecords;
export const getWorkLogs = positionWorkLogService.getWorkLogs;
export const saveWorkLog = positionWorkLogService.saveWorkLog;
export const applyWorkLog = positionWorkLogService.applyWorkLog;
export const dispatchWorkLog = positionWorkLogService.dispatchWorkLog;
export const reviewWorkLog = positionWorkLogService.reviewWorkLog;
export const submitAppeal = positionWorkLogService.submitAppeal;

export default {
  getTodayTasks,
  getUserWorkLogs,
  getWorkRecords,
  getWorkLogs,
  saveWorkLog,
  applyWorkLog,
  dispatchWorkLog,
  reviewWorkLog,
  submitAppeal
};
