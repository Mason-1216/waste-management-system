import * as equipmentService from '../services/equipmentService.js';

export const getEquipment = equipmentService.getEquipment;
export const getEquipmentByCode = equipmentService.getEquipmentByCode;
export const getEquipmentTemplate = equipmentService.getEquipmentTemplate;
export const createEquipment = equipmentService.createEquipment;
export const batchCreateEquipment = equipmentService.batchCreateEquipment;
export const importEquipment = equipmentService.importEquipment;
export const updateEquipment = equipmentService.updateEquipment;
export const deleteEquipment = equipmentService.deleteEquipment;

export default {
  getEquipment,
  getEquipmentByCode,
  getEquipmentTemplate,
  createEquipment,
  batchCreateEquipment,
  importEquipment,
  updateEquipment,
  deleteEquipment
};
