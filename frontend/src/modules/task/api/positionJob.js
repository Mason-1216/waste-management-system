import request from '@/api/request';

/**
 * 获取岗位工作项目列表
 */
export const getPositionJobs = (params) => {
  return request.get('/position-jobs', { params });
};

/**
 * 获取所有岗位名称列表
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 可选，场站ID
 */
export const getPositionNames = (params) => {
  return request.get('/position-jobs/positions', { params });
};

/**
 * 根据岗位查询工作项目
 */
export const getPositionJobsByPosition = (params) => {
  return request.get('/position-jobs/by-position', { params });
};

/**
 * 创建岗位工作项目
 */
export const createPositionJob = (data) => {
  return request.post('/position-jobs', data);
};

/**
 * 更新岗位工作项目
 */
export const updatePositionJob = (id, data) => {
  return request.put(`/position-jobs/${id}`, data);
};

/**
 * 删除岗位工作项目
 * @param {number} id - 工作项目ID
 * @param {boolean} confirmed - 是否已确认删除
 */
export const deletePositionJob = (id, confirmed = false) => {
  return request.delete(`/position-jobs/${id}`, {
    params: { confirmed: confirmed ? 'true' : 'false' }
  });
};

/**
 * 下载模板
 */
export const downloadTemplate = () => {
  return request.get('/position-jobs/template', {
    responseType: 'blob'
  });
};

/**
 * 导入岗位工作项目
 */
export const importPositionJobs = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/position-jobs/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 导入岗位工作项目预览
 */
export const previewImportPositionJobs = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/position-jobs/import-preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default {
  getPositionJobs,
  getPositionJobsByPosition,
  createPositionJob,
  updatePositionJob,
  deletePositionJob,
  downloadTemplate,
  importPositionJobs,
  previewImportPositionJobs
};
