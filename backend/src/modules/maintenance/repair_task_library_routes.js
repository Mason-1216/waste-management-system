import repairTaskLibraryController from '../../controllers/repairTaskLibraryController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../../config/upload.js';

export const registerRepairTaskLibraryRoutes = (router) => {
  router.get(
    '/repair-task-library',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management', 'maintenance']),
    repairTaskLibraryController.getRepairTaskLibrary
  );
  router.post(
    '/repair-task-library',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    repairTaskLibraryController.createRepairTaskLibrary
  );
  router.put(
    '/repair-task-library/:id',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    repairTaskLibraryController.updateRepairTaskLibrary
  );
  router.post(
    '/repair-task-library/batch-delete',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    repairTaskLibraryController.batchDeleteRepairTaskLibrary
  );
  router.delete(
    '/repair-task-library/:id',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    repairTaskLibraryController.deleteRepairTaskLibrary
  );
  router.get(
    '/repair-task-library/template',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    repairTaskLibraryController.getRepairTaskLibraryTemplate
  );
  router.post(
    '/repair-task-library/import',
    checkRole(['admin', 'department_manager', 'deputy_manager', 'senior_management']),
    upload.single('file'),
    repairTaskLibraryController.importRepairTaskLibrary
  );
};
