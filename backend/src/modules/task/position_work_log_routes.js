import positionWorkLogController from '../../controllers/positionWorkLogController.js';
import { checkRole } from '../../middlewares/permission.js';

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const recordViewerRoles = [...managerRoles, 'operator'];

export const registerPositionWorkLogRoutes = (router) => {
  router.get('/position-work-logs/today-tasks', positionWorkLogController.getTodayTasks);
  router.get(
    '/position-work-logs/user',
    checkRole(managerRoles),
    positionWorkLogController.getUserWorkLogs
  );
  router.get(
    '/position-work-logs/records',
    checkRole(recordViewerRoles),
    positionWorkLogController.getWorkRecords
  );
  router.get('/position-work-logs', positionWorkLogController.getWorkLogs);
  router.post('/position-work-logs', positionWorkLogController.saveWorkLog);
  router.post('/position-work-logs/apply', positionWorkLogController.applyWorkLog);
  router.post(
    '/position-work-logs/dispatch',
    checkRole(managerRoles),
    positionWorkLogController.dispatchWorkLog
  );
  router.put(
    '/position-work-logs/:id/review',
    checkRole(managerRoles),
    positionWorkLogController.reviewWorkLog
  );
  router.post('/position-work-logs/:id/appeal', positionWorkLogController.submitAppeal);
};
