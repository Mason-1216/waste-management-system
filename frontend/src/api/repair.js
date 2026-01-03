import request from './request';

// 获取维修记录列表
export const getRepairRecords = (params) => {
  return request.get('/repair-records', { params });
};

// 获取单个维修记录详情
export const getRepairRecordById = (id) => {
  return request.get(`/repair-records/${id}`);
};

// 创建维修记录（上报）
export const createRepairRecord = (data) => {
  return request.post('/repair-records', data);
};

// 更新维修记录
export const updateRepairRecord = (id, data) => {
  return request.put(`/repair-records/${id}`, data);
};

// 删除维修记录（仅草稿状态）
export const deleteRepairRecord = (id) => {
  return request.delete(`/repair-records/${id}`);
};

// 提交维修记录
export const submitRepairRecord = (id) => {
  return request.post(`/repair-records/${id}/submit`);
};

// 站长派发
export const dispatchRepairRecord = (id, data) => {
  return request.post(`/repair-records/${id}/dispatch`, data);
};

// 维修人员开始维修
export const startRepair = (id) => {
  return request.post(`/repair-records/${id}/start`);
};

// 维修人员完成维修
export const completeRepair = (id, data) => {
  return request.post(`/repair-records/${id}/complete`, data);
};

// 站长验收
export const verifyRepairRecord = (id, data) => {
  return request.post(`/repair-records/${id}/verify`, data);
};

export default {
  getRepairRecords,
  getRepairRecordById,
  createRepairRecord,
  updateRepairRecord,
  deleteRepairRecord,
  submitRepairRecord,
  dispatchRepairRecord,
  startRepair,
  completeRepair,
  verifyRepairRecord
};

