import * as reportService from '../services/reportService.js';

export const getWorkHoursReport = reportService.getWorkHoursReport;
export const getTemporaryTasksReport = reportService.getTemporaryTasksReport;
export const getSafetyReport = reportService.getSafetyReport;
export const getScheduleReport = reportService.getScheduleReport;
export const getMaintenanceReport = reportService.getMaintenanceReport;
export const getRepairReport = reportService.getRepairReport;
export const getMaintenanceByMonth = reportService.getMaintenanceByMonth;
export const getRepairByMonth = reportService.getRepairByMonth;
export const getPointsSummaryReport = reportService.getPointsSummaryReport;

export default {
  getWorkHoursReport,
  getTemporaryTasksReport,
  getSafetyReport,
  getScheduleReport,
  getMaintenanceReport,
  getRepairReport,
  getMaintenanceByMonth,
  getRepairByMonth,
  getPointsSummaryReport
};
