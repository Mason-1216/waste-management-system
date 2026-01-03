import request from './request';

export const getPermissions = () => request.get('/permissions');

export default {
  getPermissions
};
