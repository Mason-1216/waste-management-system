import maintenanceController from '../../controllers/maintenanceController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerMaintenancePlanRoutes = (router) => {
  router.get('/maintenance-plans', maintenanceController.getMaintenancePlans);
  router.post('/maintenance-plans', checkRole(['admin', 'station_manager']), maintenanceController.createMaintenancePlan);
  router.put('/maintenance-plans/:id', checkRole(['admin', 'station_manager']), maintenanceController.updateMaintenancePlan);
  router.delete('/maintenance-plans/:id', checkRole(['admin']), maintenanceController.deleteMaintenancePlan);
};
