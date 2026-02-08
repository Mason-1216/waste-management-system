import { Op } from 'sequelize';
import { SystemConfig } from '../../../models/index.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';

export async function listSystemConfigs(query) {
  const { page, pageSize, offset, limit } = getPagination(query || {});
  const order = getOrderBy(query || {}, { field: 'updated_at', order: 'DESC' });

  const where = {};
  if (query?.configType) where.config_type = query.configType;
  if (query?.keyword) {
    where[Op.or] = [
      { config_key: { [Op.like]: `%${query.keyword}%` } },
      { description: { [Op.like]: `%${query.keyword}%` } }
    ];
  }

  const result = await SystemConfig.findAndCountAll({
    where,
    offset,
    limit,
    order
  });

  return formatPaginationResponse(result, page, pageSize);
}

export async function getSystemConfigByKey(key) {
  return await SystemConfig.findOne({ where: { config_key: key } });
}

export async function upsertSystemConfigByKey(key, payload) {
  const data = {
    config_key: key,
    config_value: payload?.config_value ?? payload?.configValue ?? null,
    config_type: payload?.config_type ?? payload?.configType ?? 'system',
    description: payload?.description ?? null
  };

  const existing = await SystemConfig.findOne({ where: { config_key: key } });
  if (existing) {
    await existing.update(data);
    return existing;
  }
  return await SystemConfig.create(data);
}

export default { listSystemConfigs, getSystemConfigByKey, upsertSystemConfigByKey };
