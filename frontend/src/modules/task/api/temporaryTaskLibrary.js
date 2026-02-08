import request from '@/api/request';

export const getTemporaryTaskLibrary = (params) => {
  return request.get('/temporary-task-library', { params });
};

export const createTemporaryTaskLibrary = (data) => {
  return request.post('/temporary-task-library', data);
};

export const updateTemporaryTaskLibrary = (id, data) => {
  return request.put(`/temporary-task-library/${id}`, data);
};

export const deleteTemporaryTaskLibrary = (id) => {
  return request.delete(`/temporary-task-library/${id}`);
};

export default {
  getTemporaryTaskLibrary,
  createTemporaryTaskLibrary,
  updateTemporaryTaskLibrary,
  deleteTemporaryTaskLibrary
};
