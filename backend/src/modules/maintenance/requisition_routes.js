import maintenanceController from './controllers/maintenanceController.js';

export const registerMaterialRequisitionRoutes = (router) => {
  router.get('/material-requisitions', maintenanceController.getMaterialRequisitions);
  router.post('/material-requisitions', maintenanceController.createMaterialRequisition);
};
