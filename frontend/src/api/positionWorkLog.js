import request from './request';

/**
 * 获取今日工作任务（根据排班）
 */
export const getTodayTasks = () => {
  return request.get('/position-work-logs/today-tasks');
};

/**
 * 保存/更新工作登记
 */
export const saveWorkLog = (data) => {
  return request.post('/position-work-logs', data);
};

/**
 * 查询工作登记历史
 */
export const getWorkLogs = (params) => {
  return request.get('/position-work-logs', { params });
};

export default {
  getTodayTasks,
  saveWorkLog,
  getWorkLogs
};
