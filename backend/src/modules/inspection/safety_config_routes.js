import safetyCheckController from '../../controllers/safetyCheckController.js';
import { checkRole } from '../../middlewares/permission.js';
import { uploadToDisk } from '../../config/upload.js';

export const registerSafetyConfigRoutes = (router) => {
  router.get('/safety-work-types', safetyCheckController.getWorkTypes);
  router.post('/safety-work-types', checkRole(['safety_inspector']), safetyCheckController.createWorkType);
  router.put('/safety-work-types/:id', checkRole(['safety_inspector']), safetyCheckController.updateWorkType);
  router.delete('/safety-work-types/:id', checkRole(['safety_inspector']), safetyCheckController.deleteWorkType);

  router.get('/safety-check-items', safetyCheckController.getCheckItems);
  router.get('/safety-check-items/by-work-types', safetyCheckController.getCheckItemsByWorkTypes);
  router.get('/safety-check-items/template', checkRole(['safety_inspector']), safetyCheckController.getCheckItemsTemplate);
  router.post('/safety-check-items', checkRole(['safety_inspector']), safetyCheckController.createCheckItem);
  router.post('/safety-check-items/batch', checkRole(['safety_inspector']), safetyCheckController.batchCreateCheckItems);
  router.post(
    '/safety-check-items/import',
    checkRole(['safety_inspector']),
    uploadToDisk.single('file'),
    safetyCheckController.importCheckItems
  );
  router.put('/safety-check-items/:id', checkRole(['safety_inspector']), safetyCheckController.updateCheckItem);
  router.delete('/safety-check-items/:id', checkRole(['safety_inspector']), safetyCheckController.deleteCheckItem);
};
