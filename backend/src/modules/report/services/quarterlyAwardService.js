import { Op } from 'sequelize';
import { QuarterlyAwardGroup, QuarterlyAwardDetail, User, sequelize } from '../../../models/index.js';
import dayjs from 'dayjs';
import { createError } from '../../../middlewares/error.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import {
  quarterlyAwardGroupQuerySchema,
  quarterlyAwardGroupCreateSchema,
  quarterlyAwardGroupUpdateSchema,
  quarterlyAwardCalculateSchema,
  quarterlyAwardHistoryQuerySchema,
  quarterlyAwardVisualQuerySchema,
  quarterlyPointsSummaryQuerySchema,
  idParamSchema
} from '../validators/quarterlyAwardSchemas.js';
import { loadAutoPointsEvents, loadManualPointsEvents } from './reportService.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolvePageValue = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
};

// IF(score<50,0,INT((score-100)/5)/10+1)
const calcAwardCoefficient = (performanceScore) => {
  const score = toNumber(performanceScore, 0);
  if (score < 50) return 0;
  return Math.floor((score - 100) / 5) / 10 + 1;
};

const getQuarterDateRange = (year, quarter) => {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const startDate = dayjs(`${year}-${String(startMonth).padStart(2, '0')}-01`).format('YYYY-MM-DD');
  const endDate = dayjs(`${year}-${String(endMonth).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');
  return { startDate, endDate };
};

const buildUserNameMap = async (userIds) => {
  const ids = Array.isArray(userIds)
    ? userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : [];
  if (ids.length === 0) return new Map();

  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'real_name'],
    raw: true
  });

  const map = new Map();
  users.forEach((u) => {
    map.set(u.id, u.real_name ?? '');
  });
  return map;
};

const loadQuarterPointsMap = async ({ year, quarter, dataFilter, userIds }) => {
  const { startDate, endDate } = getQuarterDateRange(year, quarter);
  const range = { startDate, endDate };
  const keywordText = '';

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEvents({ range, keywordText, dataFilter }),
    loadManualPointsEvents({ range, keywordText, dataFilter })
  ]);

  const idSet = Array.isArray(userIds) && userIds.length > 0
    ? new Set(userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)))
    : null;

  const pointsMap = new Map();
  [...autoEvents, ...manualEvents].forEach((event) => {
    const userId = event?.userId;
    if (userId === undefined || userId === null || userId === '') return;
    const uid = Number(userId);
    if (!Number.isFinite(uid)) return;
    if (idSet && !idSet.has(uid)) return;

    const current = pointsMap.get(uid) ?? 0;
    pointsMap.set(uid, current + toNumber(event.points, 0));
  });

  return pointsMap;
};

const computeQuarterPointsList = async ({ year, quarter, dataFilter, userIds }) => {
  const pointsMap = await loadQuarterPointsMap({ year, quarter, dataFilter, userIds });
  const ids = Array.isArray(userIds) && userIds.length > 0
    ? userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : Array.from(pointsMap.keys());

  const userNameMap = await buildUserNameMap(ids);
  const rows = ids.map((id) => ({
    user_id: id,
    user_name: userNameMap.get(id) ?? '',
    total_points: Math.round(toNumber(pointsMap.get(id), 0) * 100) / 100
  }));

  rows.sort((a, b) => b.total_points - a.total_points);
  return rows;
};

export const getGroups = async (ctx) => {
  await validateQuery(ctx, quarterlyAwardGroupQuerySchema);
  const { year, quarter } = ctx.query;

  const where = {};
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;

  const groups = await QuarterlyAwardGroup.findAll({
    where,
    include: [{ model: QuarterlyAwardDetail, as: 'details' }],
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: groups.map(g => ({
      ...g.toJSON(),
      memberCount: g.details?.length || 0
    }))
  };
};

export const getPreviousGroups = async (ctx) => {
  await validateQuery(ctx, quarterlyAwardGroupQuerySchema);

  const now = dayjs();
  const resolvedYear = ctx.query.year ? Number(ctx.query.year) : now.year();
  const resolvedQuarter = ctx.query.quarter ? Number(ctx.query.quarter) : Math.ceil((now.month() + 1) / 3);

  const groups = await QuarterlyAwardGroup.findAll({
    where: {
      [Op.or]: [
        { year: { [Op.lt]: resolvedYear } },
        { year: resolvedYear, quarter: { [Op.lt]: resolvedQuarter } }
      ]
    },
    attributes: ['id', 'group_name', 'year', 'quarter'],
    order: [['year', 'DESC'], ['quarter', 'DESC']]
  });

  ctx.body = { code: 200, message: 'success', data: groups };
};

export const createGroup = async (ctx) => {
  const {
    group_name,
    year,
    quarter,
    per_capita_budget,
    performance_score,
    linked_group_id,
    user_ids
  } = await validateBody(ctx, quarterlyAwardGroupCreateSchema);

  const user = ctx.state.user;
  const transaction = await sequelize.transaction();
  try {
    const award_coefficient = calcAwardCoefficient(performance_score);

    const group = await QuarterlyAwardGroup.create({
      group_name,
      year,
      quarter,
      per_capita_budget,
      performance_score,
      award_coefficient,
      linked_group_id,
      created_by_id: user?.id,
      created_by_name: user?.realName
    }, { transaction });

    let memberIds = Array.isArray(user_ids) ? user_ids : [];
    if (linked_group_id && memberIds.length === 0) {
      const linkedDetails = await QuarterlyAwardDetail.findAll({
        where: { group_id: linked_group_id },
        attributes: ['user_id'],
        transaction
      });
      memberIds = linkedDetails.map(d => d.user_id);
    }

    if (memberIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: memberIds } },
        attributes: ['id', 'real_name'],
        transaction
      });

      const details = users.map(u => ({
        group_id: group.id,
        user_id: u.id,
        user_name: u.real_name,
        year,
        quarter
      }));

      await QuarterlyAwardDetail.bulkCreate(details, { transaction });
    }

    await transaction.commit();

    ctx.body = {
      code: 200,
      message: '创建成功',
      data: { id: group.id }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateGroup = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const {
    group_name,
    per_capita_budget,
    performance_score,
    linked_group_id,
    user_ids
  } = await validateBody(ctx, quarterlyAwardGroupUpdateSchema);

  const group = await QuarterlyAwardGroup.findByPk(id);
  if (!group) {
    throw createError(404, '分组不存在');
  }

  const transaction = await sequelize.transaction();
  try {
    const updateData = {};
    if (group_name !== undefined) updateData.group_name = group_name;
    if (per_capita_budget !== undefined) updateData.per_capita_budget = per_capita_budget;
    if (performance_score !== undefined) {
      updateData.performance_score = performance_score;
      updateData.award_coefficient = calcAwardCoefficient(performance_score);
    }
    if (linked_group_id !== undefined) updateData.linked_group_id = linked_group_id;

    await group.update(updateData, { transaction });

    if (user_ids !== undefined) {
      await QuarterlyAwardDetail.destroy({ where: { group_id: id }, transaction });

      const memberIds = Array.isArray(user_ids) ? user_ids : [];
      if (memberIds.length > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: memberIds } },
          attributes: ['id', 'real_name'],
          transaction
        });

        const details = users.map(u => ({
          group_id: id,
          user_id: u.id,
          user_name: u.real_name,
          year: group.year,
          quarter: group.quarter
        }));

        await QuarterlyAwardDetail.bulkCreate(details, { transaction });
      }
    }

    await transaction.commit();
    ctx.body = { code: 200, message: '保存成功', data: null };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteGroup = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);

  const group = await QuarterlyAwardGroup.findByPk(id);
  if (!group) {
    throw createError(404, '分组不存在');
  }

  await group.destroy();
  ctx.body = { code: 200, message: '删除成功', data: null };
};

export const calculateAndSave = async (ctx) => {
  const { group_id } = await validateBody(ctx, quarterlyAwardCalculateSchema);
  const groupId = Number(group_id);

  const group = await QuarterlyAwardGroup.findByPk(groupId, {
    include: [{ model: QuarterlyAwardDetail, as: 'details' }]
  });

  if (!group) {
    throw createError(404, '分组不存在');
  }

  const userIds = Array.isArray(group.details) ? group.details.map(d => d.user_id).filter(Boolean) : [];
  if (userIds.length === 0) {
    throw createError(400, '分组没有成员');
  }

  const dataFilter = ctx.state.dataFilter ?? {};
  const pointsRows = await computeQuarterPointsList({
    year: group.year,
    quarter: group.quarter,
    dataFilter,
    userIds
  });

  const pointsMap = new Map(pointsRows.map((row) => [row.user_id, toNumber(row.total_points, 0)]));
  const totalGroupPoints = userIds.reduce((sum, id) => sum + toNumber(pointsMap.get(id), 0), 0);

  const memberCount = userIds.length;
  const perCapitaBudget = toNumber(group.per_capita_budget);
  const totalBudget = perCapitaBudget * memberCount;
  const awardCoefficient = toNumber(group.award_coefficient);

  const detailsWithAward = group.details.map(d => {
    const userPoints = pointsMap.get(d.user_id) ?? 0;
    const pointsRatio = totalGroupPoints > 0 ? userPoints / totalGroupPoints : 0;
    const awardAmount = totalBudget * pointsRatio * awardCoefficient;
    return {
      id: d.id,
      total_points: userPoints,
      points_ratio: pointsRatio,
      award_amount: Math.round(awardAmount * 100) / 100
    };
  });

  detailsWithAward.sort((a, b) => b.total_points - a.total_points);
  detailsWithAward.forEach((d, index) => {
    d.ranking = index + 1;
  });

  const transaction = await sequelize.transaction();
  try {
    await group.update({
      total_points: Math.round(totalGroupPoints * 100) / 100,
      total_budget: Math.round(totalBudget * 100) / 100
    }, { transaction });

    for (const detail of detailsWithAward) {
      await QuarterlyAwardDetail.update({
        total_points: detail.total_points,
        points_ratio: detail.points_ratio,
        award_amount: detail.award_amount,
        ranking: detail.ranking
      }, {
        where: { id: detail.id },
        transaction
      });
    }

    await transaction.commit();
    ctx.body = { code: 200, message: 'success', data: null };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getQuarterlyPointsSummary = async (ctx) => {
  await validateQuery(ctx, quarterlyPointsSummaryQuerySchema);
  const { year, quarter, user_ids } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};

  const ids = Array.isArray(user_ids) ? user_ids : [];
  const list = await computeQuarterPointsList({ year, quarter, dataFilter, userIds: ids });

  ctx.body = { code: 200, message: 'success', data: list };
};

export const getHistory = async (ctx) => {
  await validateQuery(ctx, quarterlyAwardHistoryQuerySchema);
  const { year, quarter, group_name, user_name } = ctx.query;

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageValue(ctx.query.pageSize, 20);

  const where = {};
  const groupWhere = {};

  if (year) where.year = year;
  if (quarter) where.quarter = quarter;
  if (user_name) where.user_name = { [Op.like]: `%${user_name}%` };
  if (group_name) groupWhere.group_name = { [Op.like]: `%${group_name}%` };

  const { count, rows } = await QuarterlyAwardDetail.findAndCountAll({
    where,
    include: [{
      model: QuarterlyAwardGroup,
      as: 'group',
      where: Object.keys(groupWhere).length > 0 ? groupWhere : undefined,
      attributes: ['id', 'group_name', 'award_coefficient']
    }],
    order: [['year', 'DESC'], ['quarter', 'DESC'], ['ranking', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list: rows.map(r => ({
        ...r.toJSON(),
        group_name: r.group?.group_name,
        award_coefficient: r.group?.award_coefficient
      })),
      total: count,
      page,
      pageSize
    }
  };
};

export const getVisualData = async (ctx) => {
  await validateQuery(ctx, quarterlyAwardVisualQuerySchema);
  const { year, quarter, group_id } = ctx.query;

  const now = dayjs();
  const currentYear = year ? Number(year) : now.year();
  const currentQuarter = quarter ? Number(quarter) : Math.ceil((now.month() + 1) / 3);

  const rankingWhere = { year: currentYear, quarter: currentQuarter };
  if (group_id) rankingWhere.group_id = group_id;

  const rankingData = await QuarterlyAwardDetail.findAll({
    where: rankingWhere,
    order: [['total_points', 'DESC'], ['award_amount', 'DESC'], ['id', 'ASC']],
    attributes: ['user_name', 'award_amount', 'total_points']
  });

  const pieData = await QuarterlyAwardDetail.findAll({
    where: rankingWhere,
    attributes: ['user_name', 'points_ratio', 'total_points']
  });

  const trendData = await QuarterlyAwardGroup.findAll({
    where: { year: currentYear },
    attributes: ['quarter', 'total_points', 'total_budget'],
    order: [['quarter', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      ranking: rankingData.map(r => ({
        name: r.user_name,
        award: toNumber(r.award_amount),
        points: toNumber(r.total_points)
      })),
      pie: pieData.map(p => ({
        name: p.user_name,
        value: toNumber(p.total_points),
        ratio: toNumber(p.points_ratio)
      })),
      trend: trendData.map(t => ({
        quarter: `Q${t.quarter}`,
        points: toNumber(t.total_points),
        budget: toNumber(t.total_budget)
      }))
    }
  };
};

export default {
  getGroups,
  getPreviousGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  calculateAndSave,
  getQuarterlyPointsSummary,
  getHistory,
  getVisualData
};
