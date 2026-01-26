import inspectionController from '../../controllers/inspectionController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerSafetyRectificationRoutes = (router) => {
  router.get('/safety-rectifications', inspectionController.getSafetyRectifications);
  router.post(
    '/safety-rectifications',
    checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']),
    inspectionController.createSafetyRectification
  );
  router.put(
    '/safety-rectifications/:id',
    checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']),
    inspectionController.updateSafetyRectification
  );
  router.put(
    '/safety-rectifications/:id/review',
    checkRole(['safety_inspector']),
    inspectionController.reviewSafetyRectification
  );
};
