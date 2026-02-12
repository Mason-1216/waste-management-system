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

export const batchImportTemporaryTaskLibrary = (tasks) => {
  return request.post('/temporary-task-library/batch-import', { tasks });
};

export const previewBatchImportTemporaryTaskLibrary = (tasks) => {
  return request.post('/temporary-task-library/batch-import-preview', { tasks });
};

export default {
  getTemporaryTaskLibrary,
  createTemporaryTaskLibrary,
  updateTemporaryTaskLibrary,
  deleteTemporaryTaskLibrary,
  batchImportTemporaryTaskLibrary,
  previewBatchImportTemporaryTaskLibrary
};
