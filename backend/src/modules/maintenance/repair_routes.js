import maintenanceController from './controllers/maintenanceController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerRepairRecordRoutes = (router) => {
  router.get('/repair-records', maintenanceController.getRepairRecords);
  router.get('/repair-records/:id', maintenanceController.getRepairRecordById);
  router.post('/repair-records', maintenanceController.createRepairRecord);
  router.put('/repair-records/:id', maintenanceController.updateRepairRecord);
  router.delete('/repair-records/:id', maintenanceController.deleteRepairRecord);
  router.post('/repair-records/:id/submit', maintenanceController.submitRepairRecord);
  router.post(
    '/repair-records/:id/dispatch',
    checkRole(['station_manager', 'deputy_manager', 'department_manager', 'admin']),
    maintenanceController.dispatchRepairRecord
  );
  router.post('/repair-records/:id/start', checkRole(['maintenance']), maintenanceController.startRepair);
  router.post('/repair-records/:id/complete', checkRole(['maintenance']), maintenanceController.completeRepair);
  router.post(
    '/repair-records/:id/verify',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    maintenanceController.verifyRepairRecord
  );
};
