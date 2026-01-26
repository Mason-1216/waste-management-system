import reportController from '../../controllers/reportController.js';

export const registerWorkHoursReportRoutes = (router) => {
  router.get('/reports/work-hours', reportController.getWorkHoursReport);
};
