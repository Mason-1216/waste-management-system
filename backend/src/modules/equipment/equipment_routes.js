import equipmentController from './controllers/equipmentController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../file_storage/upload.js';

export const registerEquipmentResourceRoutes = (router) => {
  router.get('/equipment', equipmentController.getEquipment);
  router.get('/equipment/by-code', equipmentController.getEquipmentByCode);
  router.get(
    '/equipment/template',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    equipmentController.getEquipmentTemplate
  );
  router.post(
    '/equipment',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    equipmentController.createEquipment
  );
  router.post(
    '/equipment/batch',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    equipmentController.batchCreateEquipment
  );
  router.post(
    '/equipment/import',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    equipmentController.importEquipment
  );
  router.put(
    '/equipment/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    equipmentController.updateEquipment
  );
  router.delete(
    '/equipment/:id',
    checkRole(['station_manager', 'department_manager', 'deputy_manager']),
    equipmentController.deleteEquipment
  );
};
