import taskController from '../../controllers/taskController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerPositionTaskRoutes = (router) => {
  router.get('/position-tasks', taskController.getPositionTasks);
  router.post('/position-tasks', checkRole(['admin', 'station_manager']), taskController.savePositionTasks);
};
