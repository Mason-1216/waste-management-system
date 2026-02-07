import maintenancePositionController from './controllers/maintenancePositionController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerMaintenancePositionRoutes = (router) => {
  router.get(
    '/maintenance-position-plans',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePositionController.getMaintenancePositionPlans
  );
  router.post(
    '/maintenance-position-plans',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePositionController.createMaintenancePositionPlan
  );
  router.delete(
    '/maintenance-position-plans/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    maintenancePositionController.deleteMaintenancePositionPlan
  );

  router.get('/maintenance-work-records', maintenancePositionController.getMaintenanceWorkRecords);
  router.get('/maintenance-work-records/today-tasks', maintenancePositionController.getTodayMaintenanceTasks);
  router.get('/maintenance-work-records/:id', maintenancePositionController.getMaintenanceWorkRecordDetail);
  router.post('/maintenance-work-records', maintenancePositionController.submitMaintenanceWorkRecord);
  router.put(
    '/maintenance-work-records/:id/verify',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    maintenancePositionController.verifyMaintenanceWorkRecord
  );
};
