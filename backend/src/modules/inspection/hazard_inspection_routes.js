import inspectionController from '../../controllers/inspectionController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerHazardInspectionRoutes = (router) => {
  router.get('/hazard-inspections', inspectionController.getHazardInspections);
  router.post('/hazard-inspections', checkRole(['safety_inspector']), inspectionController.createHazardInspection);
  router.put('/hazard-inspections/:id', checkRole(['safety_inspector']), inspectionController.updateHazardInspection);
  router.delete('/hazard-inspections/:id', checkRole(['safety_inspector']), inspectionController.deleteHazardInspection);
};
