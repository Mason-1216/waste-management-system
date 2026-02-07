import * as permissionResourceService from '../services/permissionResourceService.js';

export const getPermissions = permissionResourceService.getPermissions;
export const getPermissionCatalog = permissionResourceService.getPermissionCatalog;

export default {
  getPermissions,
  getPermissionCatalog
};
