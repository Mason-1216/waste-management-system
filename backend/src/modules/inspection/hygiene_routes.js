import hygieneManagementController from '../../controllers/hygieneManagementController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerHygieneRoutes = (router) => {
  router.get('/hygiene-areas', hygieneManagementController.getHygieneAreas);
  router.post(
    '/hygiene-areas',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.createHygieneArea
  );
  router.put(
    '/hygiene-areas/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.updateHygieneArea
  );
  router.delete(
    '/hygiene-areas/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.deleteHygieneArea
  );

  router.get('/hygiene-points', hygieneManagementController.getHygienePoints);
  router.post(
    '/hygiene-points',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.createHygienePoint
  );
  router.put(
    '/hygiene-points/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.updateHygienePoint
  );
  router.delete(
    '/hygiene-points/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.deleteHygienePoint
  );

  router.get('/hygiene-position-areas', hygieneManagementController.getHygienePositionAreas);
  router.post(
    '/hygiene-position-areas',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.createHygienePositionArea
  );
  router.delete(
    '/hygiene-position-areas/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    hygieneManagementController.deleteHygienePositionArea
  );
  router.get('/hygiene-position-areas/by-position', hygieneManagementController.getHygieneAreasByPosition);
};
