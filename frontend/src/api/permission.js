import request from './request';

export const getPermissions = () => request.get('/permissions');
export const getPermissionCatalog = () => request.get('/permission-catalog');

export default {
  getPermissions,
  getPermissionCatalog
};
