import scheduleController from '../../controllers/scheduleController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerScheduleWriteRoutes = (router) => {
  router.post(
    '/schedules',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    scheduleController.saveSchedule
  );
  router.post(
    '/schedules/batch',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    scheduleController.batchSaveSchedules
  );
  router.delete(
    '/schedules/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    scheduleController.deleteSchedule
  );
  router.post(
    '/schedules/batch-delete',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    scheduleController.batchDeleteSchedules
  );
};
