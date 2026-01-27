import repairTaskLibraryController from '../../controllers/repairTaskLibraryController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../../config/upload.js';

export const registerRepairTaskLibraryRoutes = (router) => {
  router.get('/repair-task-library', repairTaskLibraryController.getRepairTaskLibrary);
  router.post(
    '/repair-task-library',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    repairTaskLibraryController.createRepairTaskLibrary
  );
  router.put(
    '/repair-task-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    repairTaskLibraryController.updateRepairTaskLibrary
  );
  router.post(
    '/repair-task-library/batch-delete',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    repairTaskLibraryController.batchDeleteRepairTaskLibrary
  );
  router.delete(
    '/repair-task-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    repairTaskLibraryController.deleteRepairTaskLibrary
  );
  router.get(
    '/repair-task-library/template',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    repairTaskLibraryController.getRepairTaskLibraryTemplate
  );
  router.post(
    '/repair-task-library/import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    repairTaskLibraryController.importRepairTaskLibrary
  );
};
