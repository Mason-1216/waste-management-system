import * as permissionResourceService from '../modules/core/services/permissionResourceService.js';

export const getPermissions = permissionResourceService.getPermissions;
export const getPermissionCatalog = permissionResourceService.getPermissionCatalog;

export default {
  getPermissions,
  getPermissionCatalog
};
