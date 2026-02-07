import * as roleService from '../services/roleService.js';

export const getRoles = roleService.getRoles;
export const getRolePermissions = roleService.getRolePermissions;
export const createRole = roleService.createRole;
export const updateRole = roleService.updateRole;
export const deleteRole = roleService.deleteRole;

export default {
  getRoles,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole
};
