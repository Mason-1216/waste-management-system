import taskController from '../../controllers/taskController.js';

export const registerTemporaryTaskRoutes = (router) => {
  router.get('/temporary-tasks', taskController.getTemporaryTasks);
  router.post('/temporary-tasks', taskController.createTemporaryTask);
  router.put('/temporary-tasks/:id', taskController.updateTemporaryTask);
  router.put('/temporary-tasks/:id/start', taskController.startTemporaryTask);
  router.put('/temporary-tasks/:id/complete', taskController.completeTemporaryTask);
  router.delete('/temporary-tasks/:id', taskController.deleteTemporaryTask);
};
