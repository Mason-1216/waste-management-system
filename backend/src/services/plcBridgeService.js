// PLC Bridge Service - 调用 Python 微服务
import axios from 'axios';
import logger from '../config/logger.js';

const PLC_SERVICE_URL = process.env.PLC_SERVICE_URL || 'http://localhost:5001';

const plcClient = axios.create({
  baseURL: PLC_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 响应拦截器
plcClient.interceptors.response.use(
  response => {
    if (response.data && response.data.code === 200) {
      return response.data;
    }
    return response.data;
  },
  error => {
    logger.error('PLC service error:', error.message);
    throw error;
  }
);

/**
 * 检查 PLC 服务状态
 */
export const checkServiceStatus = async (ip = null) => {
  try {
    if (ip) {
      const conn = await checkPlcConnection(ip);
      return { status: conn.connected ? 'running' : 'offline', connected: conn.connected, ip };
    }
    const response = await plcClient.get('/api/plc/status');
    return response.data;
  } catch (error) {
    logger.error('PLC service status check failed:', error.message);
    return { status: 'offline', error: error.message };
  }
};

/**
 * 读取单个 PLC 值
 * @param {string} ip - PLC IP 地址
 * @param {number} dbNumber - DB 块号
 * @param {number} offset - 偏移地址
 * @param {string} dataType - 数据类型
 */
export const readPlcValue = async (ip, dbNumber, offset, dataType = 'REAL') => {
  try {
    const response = await plcClient.post('/api/plc/read', {
      ip,
      db_number: dbNumber,
      offset,
      data_type: dataType
    });
    return response.data;
  } catch (error) {
    logger.error(`PLC read failed [${ip}]: ${error.message}`);
    throw error;
  }
};

/**
 * 批量读取 PLC 值
 * @param {string} ip - PLC IP 地址
 * @param {Array} readings - 读取配置数组 [{db_number, offset, data_type}]
 */
export const readPlcBatch = async (ip, readings) => {
  try {
    const response = await plcClient.post('/api/plc/read', {
      ip,
      readings
    });
    return response.data;
  } catch (error) {
    logger.error(`PLC batch read failed [${ip}]: ${error.message}`);
    throw error;
  }
};

/**
 * 从多个 PLC 批量读取
 * @param {Array} configs - 配置数组 [{ip, readings: [{db_number, offset, data_type, config_id}]}]
 */
export const readMultiplePlcBatch = async (configs) => {
  try {
    const response = await plcClient.post('/api/plc/batch-read', {
      configs
    });
    return response.data;
  } catch (error) {
    logger.error(`Multiple PLC batch read failed: ${error.message}`);
    throw error;
  }
};

/**
 * 写入 PLC 值
 * @param {string} ip - PLC IP 地址
 * @param {number} dbNumber - DB 块号
 * @param {number} offset - 偏移地址
 * @param {string} dataType - 数据类型
 * @param {*} value - 要写入的值
 */
export const writePlcValue = async (ip, dbNumber, offset, dataType, value) => {
  try {
    const response = await plcClient.post('/api/plc/write', {
      ip,
      db_number: dbNumber,
      offset,
      data_type: dataType,
      value
    });
    return response.data;
  } catch (error) {
    logger.error(`PLC write failed [${ip}]: ${error.message}`);
    throw error;
  }
};

/**
 * 检查 PLC 连接状态
 * @param {string} ip - PLC IP 地址
 */
export const checkPlcConnection = async (ip) => {
  try {
    const response = await plcClient.post('/api/plc/connection/check', {
      ip
    });
    return response.data;
  } catch (error) {
    logger.error(`PLC connection check failed [${ip}]: ${error.message}`);
    return { ip, connected: false, error: error.message };
  }
};

/**
 * 断开 PLC 连接
 * @param {string} ip - PLC IP 地址，为空则断开所有
 */
export const disconnectPlc = async (ip = null) => {
  try {
    const response = await plcClient.post('/api/plc/connection/disconnect',
      ip ? { ip } : { all: true }
    );
    return response.data;
  } catch (error) {
    logger.error(`PLC disconnect failed: ${error.message}`);
    throw error;
  }
};

export default {
  checkServiceStatus,
  readPlcValue,
  readPlcBatch,
  readMultiplePlcBatch,
  writePlcValue,
  checkPlcConnection,
  disconnectPlc
};
