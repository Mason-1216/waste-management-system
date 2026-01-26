import reportController from '../../controllers/reportController.js';

export const registerMaintenanceReportRoutes = (router) => {
  router.get('/reports/maintenance', reportController.getMaintenanceReport);
  router.get('/reports/maintenance-by-month', reportController.getMaintenanceByMonth);
};
