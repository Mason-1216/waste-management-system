import * as departmentService from '../services/departmentService.js';

export const getDepartments = departmentService.getDepartments;
export const createDepartment = departmentService.createDepartment;
export const updateDepartment = departmentService.updateDepartment;
export const deleteDepartment = departmentService.deleteDepartment;

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
