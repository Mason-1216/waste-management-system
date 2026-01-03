import request from './request';

/**
 * ============================================
 * 卫生责任区管理
 * ============================================
 */

/**
 * 查询卫生责任区列表
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 场站ID
 * @returns {Promise}
 */
export const getHygieneAreas = (params) => {
  return request.get('/hygiene-areas', { params });
};

/**
 * 创建卫生责任区
 * @param {Object} data - 责任区数据
 * @param {number} data.stationId - 场站ID
 * @param {string} data.areaName - 责任区名称
 * @returns {Promise}
 */
export const createHygieneArea = (data) => {
  return request.post('/hygiene-areas', data);
};

/**
 * 更新卫生责任区
 * @param {number} id - 责任区ID
 * @param {Object} data - 更新数据
 * @param {string} data.areaName - 责任区名称
 * @returns {Promise}
 */
export const updateHygieneArea = (id, data) => {
  return request.put(`/hygiene-areas/${id}`, data);
};

/**
 * 删除卫生责任区
 * @param {number} id - 责任区ID
 * @returns {Promise}
 */
export const deleteHygieneArea = (id) => {
  return request.delete(`/hygiene-areas/${id}`);
};

/**
 * ============================================
 * 卫生点管理
 * ============================================
 */

/**
 * 查询卫生点列表
 * @param {Object} params - 查询参数
 * @param {number} params.hygieneAreaId - 责任区ID
 * @param {number} params.stationId - 场站ID
 * @returns {Promise}
 */
export const getHygienePoints = (params) => {
  return request.get('/hygiene-points', { params });
};

/**
 * 创建卫生点
 * @param {Object} data - 卫生点数据
 * @param {number} data.hygieneAreaId - 责任区ID
 * @param {string} data.pointName - 卫生点名称
 * @param {string} data.workRequirements - 工作要求及标准
 * @returns {Promise}
 */
export const createHygienePoint = (data) => {
  return request.post('/hygiene-points', data);
};

/**
 * 更新卫生点
 * @param {number} id - 卫生点ID
 * @param {Object} data - 更新数据
 * @param {string} data.pointName - 卫生点名称
 * @param {string} data.workRequirements - 工作要求及标准
 * @returns {Promise}
 */
export const updateHygienePoint = (id, data) => {
  return request.put(`/hygiene-points/${id}`, data);
};

/**
 * 删除卫生点
 * @param {number} id - 卫生点ID
 * @returns {Promise}
 */
export const deleteHygienePoint = (id) => {
  return request.delete(`/hygiene-points/${id}`);
};

/**
 * ============================================
 * 岗位任务分配管理
 * ============================================
 */

/**
 * 查询岗位责任区关联列表
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 场站ID
 * @param {string} params.positionName - 岗位名称
 * @returns {Promise}
 */
export const getHygienePositionAreas = (params) => {
  return request.get('/hygiene-position-areas', { params });
};

/**
 * 创建岗位责任区关联
 * @param {Object} data - 关联数据
 * @param {number} data.stationId - 场站ID
 * @param {string} data.positionName - 岗位名称
 * @param {number} data.hygieneAreaId - 责任区ID
 * @returns {Promise}
 */
export const createHygienePositionArea = (data) => {
  return request.post('/hygiene-position-areas', data);
};

/**
 * 删除岗位责任区关联
 * @param {number} id - 关联ID
 * @returns {Promise}
 */
export const deleteHygienePositionArea = (id) => {
  return request.delete(`/hygiene-position-areas/${id}`);
};

/**
 * 根据岗位查询责任区及卫生点（用于卫生自检）
 * @param {Object} params - 查询参数
 * @param {number} params.stationId - 场站ID
 * @param {string} params.positionName - 岗位名称
 * @returns {Promise}
 */
export const getHygieneAreasByPosition = (params) => {
  return request.get('/hygiene-position-areas/by-position', { params });
};
