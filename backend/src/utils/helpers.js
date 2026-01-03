import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成记录编号
 * @param {string} prefix - 前缀
 * @returns {string} 记录编号
 */
export const generateRecordCode = (prefix = 'REC') => {
  const date = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${date}${random}`;
};

/**
 * 生成UUID
 * @returns {string} UUID
 */
export const generateUUID = () => {
  return uuidv4();
};

/**
 * 分页处理
 * @param {object} query - 查询参数
 * @returns {object} 分页参数
 */
export const getPagination = (query) => {
  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return { page, pageSize, offset, limit };
};

/**
 * 格式化分页响应
 * @param {object} data - 查询结果
 * @param {number} page - 当前页
 * @param {number} pageSize - 每页条数
 * @returns {object} 分页响应
 */
export const formatPaginationResponse = (data, page, pageSize) => {
  return {
    list: data.rows,
    total: data.count,
    page,
    pageSize,
    totalPages: Math.ceil(data.count / pageSize)
  };
};

/**
 * 构建排序参数
 * @param {object} query - 查询参数
 * @param {object} defaultSort - 默认排序
 * @returns {array} 排序数组
 */
export const getOrderBy = (query, defaultSort = { field: 'created_at', order: 'DESC' }) => {
  const sortBy = query.sortBy || defaultSort.field;
  const sortOrder = (query.sortOrder || defaultSort.order).toUpperCase();

  return [[sortBy, sortOrder]];
};

/**
 * 解析日期范围
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {object} 日期范围对象
 */
export const parseDateRange = (startDate, endDate) => {
  const start = startDate ? dayjs(startDate).startOf('day').toDate() : null;
  const end = endDate ? dayjs(endDate).endOf('day').toDate() : null;

  return { start, end };
};

/**
 * 计算超时分钟数
 * @param {string} deadline - 截止时间 (HH:mm:ss)
 * @param {Date} submitTime - 提交时间
 * @returns {number} 超时分钟数（负数表示未超时）
 */
export const calculateOverdueMinutes = (deadline, submitTime) => {
  const [hours, minutes] = deadline.split(':').map(Number);
  const deadlineMinutes = hours * 60 + minutes;

  const submitDate = dayjs(submitTime);
  const submitMinutes = submitDate.hour() * 60 + submitDate.minute();

  return submitMinutes - deadlineMinutes;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 清理对象中的空值
 * @param {object} obj - 对象
 * @returns {object} 清理后的对象
 */
export const cleanObject = (obj) => {
  const cleaned = {};

  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  });

  return cleaned;
};

/**
 * 生成随机密码
 * @param {number} length - 密码长度
 * @returns {string} 随机密码
 */
export const generateRandomPassword = (length = 8) => {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

/**
 * 获取当前月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {number} 天数
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

/**
 * 生成文件名
 * @param {string} projectName - 项目名称
 * @param {string} stationName - 场站名称
 * @param {string} formType - 表单类型
 * @param {string} date - 日期
 * @param {string} format - 文件格式
 * @returns {string} 文件名
 */
export const generateFileName = (projectName, stationName, formType, date, format) => {
  const dateStr = date.replace(/-/g, '');
  return `${projectName}_${stationName}_${formType}_${dateStr}.${format}`;
};

export default {
  generateRecordCode,
  generateUUID,
  getPagination,
  formatPaginationResponse,
  getOrderBy,
  parseDateRange,
  calculateOverdueMinutes,
  formatFileSize,
  cleanObject,
  generateRandomPassword,
  getDaysInMonth,
  generateFileName
};
