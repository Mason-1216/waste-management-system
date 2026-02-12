import request from '@/api/request';

// 获取分组列表
export const getQuarterlyAwardGroups = (params) => {
  return request.get('/reports/quarterly-award-groups', { params });
};

// 获取往期分组列表
export const getPreviousGroups = (year, quarter) => {
  return request.get('/reports/quarterly-award-groups/previous', { params: { year, quarter } });
};

// 创建分组
export const createQuarterlyAwardGroup = (data) => {
  return request.post('/reports/quarterly-award-groups', data);
};

// 更新分组
export const updateQuarterlyAwardGroup = (id, data) => {
  return request.put(`/reports/quarterly-award-groups/${id}`, data);
};

// 删除分组
export const deleteQuarterlyAwardGroup = (id) => {
  return request.delete(`/reports/quarterly-award-groups/${id}`);
};

// 获取季度积分汇总
export const getQuarterlyPointsSummary = (params) => {
  return request.get('/reports/quarterly-points-summary', { params });
};

// 计算并保存季度积分奖
export const calculateQuarterlyAward = (groupId) => {
  return request.post('/reports/quarterly-award-calculate', { group_id: groupId });
};

// 获取历史数据
export const getQuarterlyAwardHistory = (params) => {
  return request.get('/reports/quarterly-award-history', { params });
};

// 获取可视化数据
export const getQuarterlyAwardVisual = (params) => {
  return request.get('/reports/quarterly-award-visual', { params });
};

export default {
  getQuarterlyAwardGroups,
  getPreviousGroups,
  createQuarterlyAwardGroup,
  updateQuarterlyAwardGroup,
  deleteQuarterlyAwardGroup,
  getQuarterlyPointsSummary,
  calculateQuarterlyAward,
  getQuarterlyAwardHistory,
  getQuarterlyAwardVisual
};
