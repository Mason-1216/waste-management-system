import roleController from './controllers/roleController.js';
import permissionController from './controllers/permissionController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerAccessRoutes = (router) => {
  router.get('/roles', checkRole(['admin']), roleController.getRoles);
  router.get('/roles/:id/permissions', checkRole(['admin']), roleController.getRolePermissions);
  router.post('/roles', checkRole(['admin']), roleController.createRole);
  router.put('/roles/:id', checkRole(['admin']), roleController.updateRole);
  router.delete('/roles/:id', checkRole(['admin']), roleController.deleteRole);
  router.get('/permissions', checkRole(['admin']), permissionController.getPermissions);
  // Lightweight menu permission catalog for all logged-in users.
  router.get('/permission-catalog', permissionController.getPermissionCatalog);
};
