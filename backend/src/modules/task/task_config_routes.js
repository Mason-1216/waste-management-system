import taskController from './controllers/taskController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerTaskConfigRoutes = (router) => {
  router.get('/task-configs', taskController.getTaskConfigs);
  router.post('/task-configs', checkRole(['admin', 'station_manager']), taskController.createTaskConfig);
  router.put('/task-configs/:id', checkRole(['admin', 'station_manager']), taskController.updateTaskConfig);
  router.delete('/task-configs/:id', checkRole(['admin']), taskController.deleteTaskConfig);
};
