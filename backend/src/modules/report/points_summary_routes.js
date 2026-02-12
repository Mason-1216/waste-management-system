import reportController from './controllers/reportController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../file_storage/upload.js';

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];

export const registerPointsSummaryReportRoutes = (router) => {
  router.get('/reports/points-summary', reportController.getPointsSummaryReport);
  router.get('/reports/points-summary-period', reportController.getPointsSummaryPeriodReport);
  router.get('/reports/points-details', reportController.getPointsDetailsReport);
  router.get('/reports/points-summary-drilldown', reportController.getPointsSummaryDrilldownReport);
  router.get('/reports/points-summary-task-category', reportController.getPointsSummaryTaskCategoryPeriodReport);
  router.get('/reports/points-cycle-analysis', reportController.getPointsCycleAnalysisReport);
  router.get('/reports/points-manual-template', checkRole(managerRoles), reportController.downloadManualPointsTemplate);
  router.post(
    '/reports/points-manual-import',
    checkRole(managerRoles),
    upload.single('file'),
    reportController.importManualPoints
  );
  router.post(
    '/reports/points-manual-import-preview',
    checkRole(managerRoles),
    upload.single('file'),
    reportController.previewImportManualPoints
  );
};
