import request from '@/api/request';

/**
 * 获取所有场站列表
 */
export const getAllStations = () => {
  return request.get('/stations/all');
};

/**
 * 获取场站列表（分页）
 */
export const getStations = (params) => {
  return request.get('/stations', { params });
};

/**
 * 获取场站详情
 */
export const getStationById = (id) => {
  return request.get(`/stations/${id}`);
};

/**
 * 创建场站
 */
export const createStation = (data) => {
  return request.post('/stations', data);
};

/**
 * 更新场站
 */
export const updateStation = (id, data) => {
  return request.put(`/stations/${id}`, data);
};

/**
 * 删除场站
 */
export const deleteStation = (id) => {
  return request.delete(`/stations/${id}`);
};

export default {
  getAllStations,
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
};

