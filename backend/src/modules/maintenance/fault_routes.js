import maintenanceController from './controllers/maintenanceController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerFaultReportRoutes = (router) => {
  router.get('/fault-reports', maintenanceController.getFaultReports);
  router.post('/fault-reports', maintenanceController.createFaultReport);
  router.post(
    '/fault-reports/:id/assign',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    maintenanceController.assignFaultReport
  );
};
