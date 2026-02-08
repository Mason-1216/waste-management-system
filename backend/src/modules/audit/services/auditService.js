import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { OperationLog } from '../../../models/index.js';
import logger from '../../../config/logger.js';

export async function logOperation(payload) {
  if (!payload) return null;
  try {
    return await OperationLog.create(payload);
  } catch (error) {
    logger.error('OperationLog.create failed', error);
    return null;
  }
}

export async function cleanupOldOperationLogs(options = {}) {
  const days = Number.isFinite(options.days) ? options.days : 30;
  const threshold = dayjs().subtract(days, 'day').toDate();

  const result = await OperationLog.destroy({
    where: {
      created_at: { [Op.lt]: threshold }
    }
  });

  logger.info('Cleaned ' + result + ' operation log(s) older than ' + days + ' day(s)');
  return result;
}

export default { logOperation, cleanupOldOperationLogs };
