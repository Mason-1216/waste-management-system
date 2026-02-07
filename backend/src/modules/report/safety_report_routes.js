import reportController from './controllers/reportController.js';

export const registerSafetyReportRoutes = (router) => {
  router.get('/reports/safety', reportController.getSafetyReport);
};
