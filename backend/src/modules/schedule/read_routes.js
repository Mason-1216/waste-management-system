import scheduleController from '../../controllers/scheduleController.js';

export const registerScheduleReadRoutes = (router) => {
  router.get('/schedules', scheduleController.getSchedules);
  router.get('/schedules/overview', scheduleController.getSchedulesOverview);
  router.get('/schedules/my', scheduleController.getMySchedule);
  router.get('/schedules/export-my', scheduleController.exportMySchedule);
  router.get('/schedules/today', scheduleController.getTodayScheduledUsers);
};
