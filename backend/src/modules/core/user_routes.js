import userController from '../../controllers/userController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerUserRoutes = (router) => {
  router.get(
    '/users',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager', 'safety_inspector']),
    userController.getUsers
  );
  router.get('/users/:id', userController.getUserById);
  router.post('/users', checkRole(['admin']), userController.createUser);
  router.post('/users/batch-import', checkRole(['admin']), userController.batchImportUsers);
  router.put('/users/:id', checkRole(['admin']), userController.updateUser);
  router.delete('/users/:id', checkRole(['admin']), userController.deleteUser);
  router.put('/users/:id/reset-password', checkRole(['admin']), userController.resetPassword);
  router.post('/users/:id/stations', checkRole(['admin']), userController.bindUserStations);
};
