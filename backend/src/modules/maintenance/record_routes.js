import maintenanceController from './controllers/maintenanceController.js';

export const registerMaintenanceRecordRoutes = (router) => {
  router.get('/maintenance-records', maintenanceController.getMaintenanceRecords);
  router.post('/maintenance-records', maintenanceController.createMaintenanceRecord);
};
