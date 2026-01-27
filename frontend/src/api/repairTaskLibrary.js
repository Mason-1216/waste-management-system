import request from '@/api/request';

export const getRepairTaskLibrary = (params) => {
  return request.get('/repair-task-library', { params });
};

export const createRepairTask = (data) => {
  return request.post('/repair-task-library', data);
};

export const updateRepairTask = (id, data) => {
  return request.put(`/repair-task-library/${id}`, data);
};

export const deleteRepairTask = (id) => {
  return request.delete(`/repair-task-library/${id}`);
};

export const batchDeleteRepairTasks = (ids) => {
  return request.post('/repair-task-library/batch-delete', { ids });
};

export const downloadTemplate = () => {
  return request.get('/repair-task-library/template', {
    responseType: 'blob'
  });
};

export const importTasks = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/repair-task-library/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default {
  getRepairTaskLibrary,
  createRepairTask,
  updateRepairTask,
  deleteRepairTask,
  batchDeleteRepairTasks,
  downloadTemplate,
  importTasks
};
