import temporaryTaskLibraryController from '../../controllers/temporaryTaskLibraryController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerTemporaryTaskLibraryRoutes = (router) => {
  router.get('/temporary-task-library', temporaryTaskLibraryController.getTemporaryTaskLibrary);
  router.post(
    '/temporary-task-library',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    temporaryTaskLibraryController.createTemporaryTaskLibrary
  );
  router.post(
    '/temporary-task-library/batch-import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    temporaryTaskLibraryController.batchImportTemporaryTaskLibrary
  );
  router.put(
    '/temporary-task-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    temporaryTaskLibraryController.updateTemporaryTaskLibrary
  );
  router.delete(
    '/temporary-task-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    temporaryTaskLibraryController.deleteTemporaryTaskLibrary
  );
};
