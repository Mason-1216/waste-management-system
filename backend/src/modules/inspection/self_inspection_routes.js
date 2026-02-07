import inspectionController from './controllers/inspectionController.js';

export const registerSelfInspectionRoutes = (router) => {
  router.get('/self-inspections', inspectionController.getSelfInspections);
  router.get('/self-inspections/my', inspectionController.getMySelfInspections);
  router.get('/self-inspections/overdue', inspectionController.getOverdueUsers);
  router.post('/self-inspections', inspectionController.createSelfInspection);
};
