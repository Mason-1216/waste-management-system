import reportController from '../../controllers/reportController.js';

export const registerTemporaryTaskReportRoutes = (router) => {
  router.get('/reports/temporary-tasks', reportController.getTemporaryTasksReport);
};
