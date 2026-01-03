import request from './request';

export const getRoles = () => request.get('/roles');

export const getRolePermissions = (id) => request.get(`/roles/${id}/permissions`);

export const createRole = (data) => request.post('/roles', data);

export const updateRole = (id, data) => request.put(`/roles/${id}`, data);

export const deleteRole = (id) => request.delete(`/roles/${id}`);

export default {
  getRoles,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole
};
