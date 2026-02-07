import hazardConfigController from './controllers/hazardConfigController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerHazardConfigRoutes = (router) => {
  router.get('/hazard-categories', hazardConfigController.getHazardCategories);
  router.post('/hazard-categories', checkRole(['safety_inspector']), hazardConfigController.createHazardCategory);
  router.put('/hazard-categories/:id', checkRole(['safety_inspector']), hazardConfigController.updateHazardCategory);
  router.delete('/hazard-categories/:id', checkRole(['safety_inspector']), hazardConfigController.deleteHazardCategory);

  router.get('/hazard-root-causes', hazardConfigController.getHazardRootCauses);
  router.post(
    '/hazard-root-causes',
    checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']),
    hazardConfigController.createHazardRootCause
  );
  router.put(
    '/hazard-root-causes/:id',
    checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']),
    hazardConfigController.updateHazardRootCause
  );
  router.delete(
    '/hazard-root-causes/:id',
    checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']),
    hazardConfigController.deleteHazardRootCause
  );
};
