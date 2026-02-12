import request from '@/api/request';

/**
 * 查询设备列表
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 场站ID
 * @param {string} params.equipmentCode - 设备编号（模糊搜索）
 * @returns {Promise}
 */
export const getEquipment = (params) => {
  return request.get('/equipment', { params });
};

/**
 * 根据设备编号查询设备详情
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 场站ID
 * @param {string} params.equipmentCode - 设备编号
 * @returns {Promise}
 */
export const getEquipmentByCode = (params) => {
  return request.get('/equipment/by-code', { params });
};

/**
 * 创建设备
 * @param {Object} data - 设备数据
 * @param {number} data.stationId - 场站ID
 * @param {string} data.equipmentCode - 设备编号
 * @param {string} data.equipmentName - 设备名称
 * @param {string} data.installationLocation - 安装地点
 * @returns {Promise}
 */
export const createEquipment = (data) => {
  return request.post('/equipment', data);
};

/**
 * 批量创建设备
 * @param {Object} data - 批量数据
 * @param {Array} data.equipmentList - 设备列表
 * @returns {Promise}
 */
export const batchCreateEquipment = (data) => {
  return request.post('/equipment/batch', data);
};

/**
 * 更新设备
 * @param {number} id - 设备ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
export const updateEquipment = (id, data) => {
  return request.put(`/equipment/${id}`, data);
};

/**
 * 删除设备
 * @param {number} id - 设备ID
 * @returns {Promise}
 */
export const deleteEquipment = (id) => {
  return request.delete(`/equipment/${id}`);
};

/**
 * 下载设备导入模板
 * @returns {Promise}
 */
export const downloadEquipmentTemplate = () => {
  return request.get('/equipment/template', {
    responseType: 'blob'
  });
};

/**
 * 批量导入设备
 * @param {File} file - Excel文件
 * @returns {Promise}
 */
export const importEquipment = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/equipment/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 设备导入预览
 * @param {File} file - Excel文件
 * @returns {Promise}
 */
export const previewImportEquipment = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/equipment/import-preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
