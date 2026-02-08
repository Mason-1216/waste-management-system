import request from '@/api/request';

/**
 * ?????????/?????
 */
export const getTodayTasks = (params) => {
  return request.get('/position-work-logs/today-tasks', { params });
};

/**
 * ??/??????
 */
export const saveWorkLog = (data) => {
  return request.post('/position-work-logs', data);
};

/**
 * ??????
 */
export const applyWorkLog = (data) => {
  return request.post('/position-work-logs/apply', data);
};

/**
 * ????
 */
export const dispatchWorkLog = (data) => {
  return request.post('/position-work-logs/dispatch', data);
};

/**
 * ????????????
 */
export const getWorkLogs = (params) => {
  return request.get('/position-work-logs', { params });
};

/**
 * ????????
 */
export const getWorkRecords = (params) => {
  return request.get('/position-work-logs/records', { params });
};

/**
 * ??????
 */
export const reviewWorkLog = (id, data) => {
  return request.put(`/position-work-logs/${id}/review`, data);
};

/**
 * ??????
 */
export const submitAppeal = (id, data) => {
  return request.post(`/position-work-logs/${id}/appeal`, data);
};

export default {
  getTodayTasks,
  saveWorkLog,
  applyWorkLog,
  dispatchWorkLog,
  getWorkLogs,
  getWorkRecords,
  reviewWorkLog,
  submitAppeal
};

