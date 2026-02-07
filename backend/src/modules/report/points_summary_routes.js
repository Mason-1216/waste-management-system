import reportController from './controllers/reportController.js';

export const registerPointsSummaryReportRoutes = (router) => {
  router.get('/reports/points-summary', reportController.getPointsSummaryReport);
};
