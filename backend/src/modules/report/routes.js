import { registerWorkHoursReportRoutes } from './work_hours_routes.js';
import { registerMaintenanceReportRoutes } from './maintenance_report_routes.js';
import { registerRepairReportRoutes } from './repair_report_routes.js';
import { registerSafetyReportRoutes } from './safety_report_routes.js';
import { registerScheduleReportRoutes } from './schedule_report_routes.js';
import { registerTemporaryTaskReportRoutes } from './temporary_task_report_routes.js';
import { registerPointsSummaryReportRoutes } from './points_summary_routes.js';

export const registerReportRoutes = (router) => {
  registerWorkHoursReportRoutes(router);
  registerMaintenanceReportRoutes(router);
  registerRepairReportRoutes(router);
  registerSafetyReportRoutes(router);
  registerScheduleReportRoutes(router);
  registerTemporaryTaskReportRoutes(router);
  registerPointsSummaryReportRoutes(router);
};
