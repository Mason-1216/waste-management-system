import reportController from './controllers/reportController.js';

export const registerScheduleReportRoutes = (router) => {
  router.get('/reports/schedule', reportController.getScheduleReport);
};
