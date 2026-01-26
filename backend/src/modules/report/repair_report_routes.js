import reportController from '../../controllers/reportController.js';

export const registerRepairReportRoutes = (router) => {
  router.get('/reports/repair', reportController.getRepairReport);
  router.get('/reports/repair-by-month', reportController.getRepairByMonth);
};
