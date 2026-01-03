import cron from 'node-cron';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { Station, User, Role, Schedule, SafetySelfInspection, Notification } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * 启动所有定时任务
 */
export function startCronJobs(io) {
  logger.info('✅ 定时任务已启动');

  // 每分钟检查自检表超时情况
  cron.schedule('* * * * *', async () => {
    try {
      await checkInspectionOverdue(io);
    } catch (error) {
      logger.error('自检表超时检查失败:', error);
    }
  });

  // 每天凌晨1点清理30天前的操作日志
  cron.schedule('0 1 * * *', async () => {
    try {
      await cleanOldLogs();
    } catch (error) {
      logger.error('清理旧日志失败:', error);
    }
  });

  // 每天早上7点发送今日待办提醒
  cron.schedule('0 7 * * *', async () => {
    try {
      await sendDailyReminder(io);
    } catch (error) {
      logger.error('发送每日提醒失败:', error);
    }
  });
}

/**
 * 检查自检表超时情况
 */
async function checkInspectionOverdue(io) {
  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const currentMinutes = now.hour() * 60 + now.minute();

  const stations = await Station.findAll({
    where: { status: 'active' }
  });

  for (const station of stations) {
    const checkInTime = station.check_in_time || '08:10:00';
    const [hour, minute] = checkInTime.split(':').map(Number);
    const deadlineMinutes = hour * 60 + minute;
    const overdueMinutes = currentMinutes - deadlineMinutes;

    if (overdueMinutes <= 0) continue;

    // 获取今日有排班的人员
    const scheduledUsers = await getScheduledUsers(station.id, today);
    if (scheduledUsers.length === 0) continue;

    // 获取今日已完成自检的人员
    const completedInspections = await SafetySelfInspection.findAll({
      where: {
        station_id: station.id,
        inspection_date: today
      },
      attributes: ['filler_id']
    });

    const completedUserIds = completedInspections.map(i => i.filler_id);
    const overdueUsers = scheduledUsers.filter(u => !completedUserIds.includes(u.id));

    if (overdueUsers.length === 0) continue;

    // 分级通知（只在特定超时时间点通知一次）
    if (overdueMinutes === 10) {
      await notifyByRole(station, overdueUsers, ['station_manager'], '10分钟超时', io);
    } else if (overdueMinutes === 30) {
      await notifyByRole(station, overdueUsers, ['deputy_manager', 'safety_inspector'], '30分钟超时', io);
    } else if (overdueMinutes === 60) {
      await notifyByRole(station, overdueUsers, ['department_manager'], '60分钟超时', io);
    } else if (overdueMinutes === 90) {
      await notifyByRole(station, overdueUsers, ['executive_vp', 'chief_engineer', 'general_manager', 'chairman'], '90分钟超时', io);
    }
  }
}

/**
 * 获取今日有排班的用户
 */
async function getScheduledUsers(stationId, date) {
  const [year, month] = date.split('-');

  const schedules = await Schedule.findAll({
    where: {
      station_id: stationId,
      year: parseInt(year),
      month: parseInt(month)
    },
    include: [{ model: User, as: 'user', where: { status: 'active' } }]
  });

  const users = [];
  for (const schedule of schedules) {
    if (schedule.schedules && schedule.schedules[date] && schedule.schedules[date] !== '休') {
      if (schedule.user) {
        users.push(schedule.user);
      }
    }
  }

  return users;
}

/**
 * 按角色发送通知
 */
async function notifyByRole(station, overdueUsers, roleCodes, level, io) {
  const receivers = await User.findAll({
    where: { status: 'active' },
    include: [{
      model: Role,
      as: 'role',
      where: { role_code: { [Op.in]: roleCodes } }
    }]
  });

  const overdueUserNames = overdueUsers.map(u => u.real_name).join('、');

  for (const receiver of receivers) {
    // 检查今天是否已发送过相同级别的通知
    const existingNotification = await Notification.findOne({
      where: {
        receiver_id: receiver.id,
        related_type: `inspection_overdue_${level}`,
        created_at: {
          [Op.gte]: dayjs().startOf('day').toDate()
        }
      }
    });

    if (existingNotification) continue;

    const notification = await Notification.create({
      notify_type: 'inspection_overdue',
      title: `自检表超时提醒（${level}）`,
      content: `${station.station_name} 有 ${overdueUsers.length} 人未按时完成自检表：${overdueUserNames}`,
      receiver_id: receiver.id,
      receiver_name: receiver.real_name,
      related_type: `inspection_overdue_${level}`
    });

    // 通过WebSocket实时推送
    if (io) {
      io.to(`user_${receiver.id}`).emit('notification', {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.notify_type,
        createdAt: notification.created_at
      });
    }

    logger.info(`已发送自检超时通知给 ${receiver.real_name}（${level}）`);
  }
}

/**
 * 清理旧日志
 */
async function cleanOldLogs() {
  const { OperationLog } = await import('../models/index.js');
  const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

  const result = await OperationLog.destroy({
    where: {
      created_at: { [Op.lt]: thirtyDaysAgo }
    }
  });

  logger.info(`已清理 ${result} 条30天前的操作日志`);
}

/**
 * 发送每日待办提醒
 */
async function sendDailyReminder(io) {
  // 获取所有活跃用户
  const users = await User.findAll({
    where: { status: 'active' },
    include: [{ model: Role, as: 'role' }]
  });

  for (const user of users) {
    // 根据角色生成待办提醒
    let reminderContent = '';

    if (['operator', 'maintenance'].includes(user.role?.role_code)) {
      reminderContent = '请记得按时完成今日自检表和工作任务';
    } else if (user.role?.role_code === 'station_manager') {
      reminderContent = '请及时审核今日待审核的工时和保养记录';
    }

    if (reminderContent) {
      await Notification.create({
        notify_type: 'task_pending',
        title: '每日待办提醒',
        content: reminderContent,
        receiver_id: user.id,
        receiver_name: user.real_name
      });
    }
  }

  logger.info('每日待办提醒发送完成');
}

export default { startCronJobs };
