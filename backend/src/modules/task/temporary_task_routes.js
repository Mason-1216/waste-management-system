import taskController from '../../controllers/taskController.js';
import { checkRole } from '../../middlewares/permission.js';

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management', 'dev_test'];

export const registerTemporaryTaskRoutes = (router) => {
  router.get('/temporary-tasks', taskController.getTemporaryTasks);
  router.post('/temporary-tasks', taskController.createTemporaryTask);
  router.put('/temporary-tasks/:id', taskController.updateTemporaryTask);
  router.put('/temporary-tasks/:id/submit', taskController.submitTemporaryTask);
  router.put('/temporary-tasks/:id/review', checkRole(managerRoles), taskController.reviewTemporaryTask);
  router.delete('/temporary-tasks/:id', taskController.deleteTemporaryTask);
};
