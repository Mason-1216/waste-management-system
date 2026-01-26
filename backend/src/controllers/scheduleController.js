import * as scheduleService from '../modules/schedule/services/scheduleService.js';

export const getSchedules = scheduleService.getSchedules;
export const getSchedulesOverview = scheduleService.getSchedulesOverview;
export const saveSchedule = scheduleService.saveSchedule;
export const batchSaveSchedules = scheduleService.batchSaveSchedules;
export const getMySchedule = scheduleService.getMySchedule;
export const getTodayScheduledUsers = scheduleService.getTodayScheduledUsers;
export const deleteSchedule = scheduleService.deleteSchedule;
export const batchDeleteSchedules = scheduleService.batchDeleteSchedules;
export const exportMySchedule = scheduleService.exportMySchedule;

export default {
  getSchedules,
  getSchedulesOverview,
  saveSchedule,
  batchSaveSchedules,
  getMySchedule,
  getTodayScheduledUsers,
  deleteSchedule,
  batchDeleteSchedules,
  exportMySchedule
};
