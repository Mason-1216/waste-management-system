import inspectionController from '../../controllers/inspectionController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerOtherInspectionRoutes = (router) => {
  router.get('/other-inspections', inspectionController.getOtherInspections);
  router.post(
    '/other-inspections',
    checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']),
    inspectionController.createOtherInspection
  );
};
