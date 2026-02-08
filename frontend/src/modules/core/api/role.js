import request from '@/api/request';

export const getRoles = (params) => request.get('/roles', { params });

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

