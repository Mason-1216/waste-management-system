import taskController from '../../controllers/taskController.js';

export const registerDailyTaskRoutes = (router) => {
  router.get('/daily-tasks', taskController.getDailyTasks);
  router.get('/daily-tasks/my', taskController.getMyDailyTasks);
  router.get('/daily-tasks/summary', taskController.getDailyTaskSummary);
  router.post('/daily-tasks/submit', taskController.submitDailyTasks);
};
