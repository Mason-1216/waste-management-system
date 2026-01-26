import maintenancePlanLibraryController from '../../controllers/maintenancePlanLibraryController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerMaintenancePlanLibraryRoutes = (router) => {
  router.get('/maintenance-plan-library', maintenancePlanLibraryController.getMaintenancePlanLibrary);
  router.post(
    '/maintenance-plan-library',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.createMaintenancePlanLibrary
  );
  router.post(
    '/maintenance-plan-library/batch-import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.batchImportMaintenancePlanLibrary
  );
  router.put(
    '/maintenance-plan-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.updateMaintenancePlanLibrary
  );
  router.delete(
    '/maintenance-plan-library/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.deleteMaintenancePlanLibrary
  );
};
