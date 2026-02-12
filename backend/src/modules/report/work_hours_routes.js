import reportController from './controllers/reportController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../file_storage/upload.js';

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];

export const registerWorkHoursReportRoutes = (router) => {
  router.get('/reports/work-hours', reportController.getWorkHoursReport);
  router.get('/reports/applied-hourly-points', reportController.getAppliedHourlyPointsReport);
  router.post('/reports/applied-hourly-points/adjust', checkRole(managerRoles), reportController.saveAdjustedHourlyPoints);
  router.get('/reports/applied-hourly-points/history', reportController.getAdjustedHourlyPointsHistory);

  router.get('/reports/work-hours-manual-template', checkRole(managerRoles), reportController.downloadManualWorkHoursTemplate);
  router.post(
    '/reports/work-hours-manual-import',
    checkRole(managerRoles),
    upload.single('file'),
    reportController.importManualWorkHours
  );
  router.post(
    '/reports/work-hours-manual-import-preview',
    checkRole(managerRoles),
    upload.single('file'),
    reportController.previewImportManualWorkHours
  );

  // 工时记录列表/编辑/删除
  router.get('/reports/work-hours-list', reportController.getManualWorkHoursList);
  router.put('/reports/work-hours/:id', checkRole(managerRoles), reportController.updateManualWorkHour);
  router.delete('/reports/work-hours/:id', checkRole(managerRoles), reportController.deleteManualWorkHour);
};

