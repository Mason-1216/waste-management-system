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
export const getPointsSummaryPeriodReport = reportService.getPointsSummaryPeriodReport;
export const getPointsDetailsReport = reportService.getPointsDetailsReport;
export const getPointsSummaryDrilldownReport = reportService.getPointsSummaryDrilldownReport;
export const getPointsSummaryTaskCategoryPeriodReport = reportService.getPointsSummaryTaskCategoryPeriodReport;
export const getAppliedHourlyPointsReport = reportService.getAppliedHourlyPointsReport;
export const saveAdjustedHourlyPoints = reportService.saveAdjustedHourlyPoints;
export const getAdjustedHourlyPointsHistory = reportService.getAdjustedHourlyPointsHistory;
export const downloadManualPointsTemplate = reportService.downloadManualPointsTemplate;
export const importManualPoints = reportService.importManualPoints;
export const downloadManualWorkHoursTemplate = reportService.downloadManualWorkHoursTemplate;
export const importManualWorkHours = reportService.importManualWorkHours;
export const getManualWorkHoursList = reportService.getManualWorkHoursList;
export const updateManualWorkHour = reportService.updateManualWorkHour;
export const deleteManualWorkHour = reportService.deleteManualWorkHour;
export const getPointsCycleAnalysisReport = reportService.getPointsCycleAnalysisReport;

export default {
  getWorkHoursReport,
  getTemporaryTasksReport,
  getSafetyReport,
  getScheduleReport,
  getMaintenanceReport,
  getRepairReport,
  getMaintenanceByMonth,
  getRepairByMonth,
  getPointsSummaryReport,
  getPointsSummaryPeriodReport,
  getPointsDetailsReport,
  getPointsSummaryDrilldownReport,
  getPointsSummaryTaskCategoryPeriodReport,
  getAppliedHourlyPointsReport,
  saveAdjustedHourlyPoints,
  getAdjustedHourlyPointsHistory,
  downloadManualPointsTemplate,
  importManualPoints,
  downloadManualWorkHoursTemplate,
  importManualWorkHours,
  getManualWorkHoursList,
  updateManualWorkHour,
  deleteManualWorkHour,
  getPointsCycleAnalysisReport
};
