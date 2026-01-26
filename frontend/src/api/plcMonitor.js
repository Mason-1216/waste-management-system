// PLC Monitor API Service
import request from '@/utils/request';

// ============================================
// 实时数据
// ============================================
export const getRealtimeData = (params) => {
  return request.get('/plc-monitor/realtime', { params });
};

// ============================================
// 历史数据
// ============================================
export const getHistoryData = (params) => {
  return request.get('/plc-monitor/history', { params });
};

// ============================================
// 监控配置
// ============================================
export const getConfigs = (params) => {
  return request.get('/plc-monitor/configs', { params });
};

export const createConfig = (data) => {
  return request.post('/plc-monitor/configs', data);
};

export const updateConfig = (id, data) => {
  return request.put(`/plc-monitor/configs/${id}`, data);
};

export const deleteConfig = (id) => {
  return request.delete(`/plc-monitor/configs/${id}`);
};

export const importConfigs = (configs) => {
  return request.post('/plc-monitor/configs/import', { configs });
};

export const importConfigFile = (formData) => {
  return request.post('/plc-monitor/configs/import', formData);
};

export const downloadConfigTemplate = () => {
  return request.get('/plc-monitor/configs/template', { responseType: 'blob' });
};

// ============================================
// 分类管理
// ============================================
export const getCategories = (params) => {
  return request.get('/plc-monitor/categories', { params });
};

export const createCategory = (data) => {
  return request.post('/plc-monitor/categories', data);
};

export const updateCategory = (id, data) => {
  return request.put(`/plc-monitor/categories/${id}`, data);
};

export const deleteCategory = (id) => {
  return request.delete(`/plc-monitor/categories/${id}`);
};

// ============================================
// 报表
// ============================================
export const getReportStats = (params) => {
  return request.get('/plc-monitor/reports/stats', { params });
};

export const getReportTrends = (params) => {
  return request.get('/plc-monitor/reports/trends', { params });
};

export const exportReport = (params) => {
  return request.get('/plc-monitor/reports/export', {
    params,
    responseType: 'blob'
  });
};

export const getCumulativeReport = (params) => {
  return request.get('/plc-monitor/reports/cumulative', { params });
};

export const getFluctuatingReport = (params) => {
  return request.get('/plc-monitor/reports/fluctuating', { params });
};

// ============================================
// 服务状态
// ============================================
export const checkServiceStatus = (params) => {
  return request.get('/plc-monitor/service-status', { params });
};

// ============================================
// 历史汇总
// ============================================
export const getHistorySummary = (params) => {
  return request.get('/plc-monitor/history/summary', { params });
};

// ============================================
// 历史数据导入
// ============================================
export const downloadHistoryTemplate = () => {
  return request.get('/plc-monitor/history/template', { responseType: 'blob' });
};

export const importHistoryData = (formData) => {
  return request.post('/plc-monitor/history/import', formData);
};

// ============================================
// 写入 PLC
// ============================================
export const writeConfigValue = (data) => {
  return request.post('/plc-monitor/write', data);
};

export default {
  getRealtimeData,
  getHistoryData,
  getConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  importConfigs,
  importConfigFile,
  downloadConfigTemplate,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getReportStats,
  getReportTrends,
  exportReport,
  getCumulativeReport,
  getFluctuatingReport,
  checkServiceStatus,
  getHistorySummary,
  downloadHistoryTemplate,
  importHistoryData,
  writeConfigValue
};
