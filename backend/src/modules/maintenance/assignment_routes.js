import maintenancePlanLibraryController from './controllers/maintenancePlanLibraryController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerMaintenanceAssignmentRoutes = (router) => {
  router.get('/maintenance-assignments', maintenancePlanLibraryController.getMaintenanceAssignments);
  router.post(
    '/maintenance-assignments',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.createMaintenanceAssignment
  );
  router.put('/maintenance-assignments/:id', maintenancePlanLibraryController.updateMaintenanceAssignment);
  router.put('/maintenance-assignments/:id/start', maintenancePlanLibraryController.startMaintenanceAssignment);
  router.put('/maintenance-assignments/:id/complete', maintenancePlanLibraryController.completeMaintenanceAssignment);
  router.post(
    '/maintenance-assignments/:id/verify',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    maintenancePlanLibraryController.verifyMaintenanceAssignment
  );
  router.delete(
    '/maintenance-assignments/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePlanLibraryController.deleteMaintenanceAssignment
  );
};
