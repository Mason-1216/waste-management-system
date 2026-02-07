import * as taskService from '../modules/task/services/taskService.js';

export const getTaskConfigs = taskService.getTaskConfigs;
export const createTaskConfig = taskService.createTaskConfig;
export const updateTaskConfig = taskService.updateTaskConfig;
export const deleteTaskConfig = taskService.deleteTaskConfig;
export const getPositionTasks = taskService.getPositionTasks;
export const savePositionTasks = taskService.savePositionTasks;
export const getDailyTasks = taskService.getDailyTasks;
export const getMyDailyTasks = taskService.getMyDailyTasks;
export const getDailyTaskSummary = taskService.getDailyTaskSummary;
export const submitDailyTasks = taskService.submitDailyTasks;
export const getTemporaryTasks = taskService.getTemporaryTasks;
export const createTemporaryTask = taskService.createTemporaryTask;
export const updateTemporaryTask = taskService.updateTemporaryTask;
export const submitTemporaryTask = taskService.submitTemporaryTask;
export const reviewTemporaryTask = taskService.reviewTemporaryTask;
export const deleteTemporaryTask = taskService.deleteTemporaryTask;

export default {
  getTaskConfigs,
  createTaskConfig,
  updateTaskConfig,
  deleteTaskConfig,
  getPositionTasks,
  savePositionTasks,
  getDailyTasks,
  getMyDailyTasks,
  getDailyTaskSummary,
  submitDailyTasks,
  getTemporaryTasks,
  createTemporaryTask,
  updateTemporaryTask,
  submitTemporaryTask,
  reviewTemporaryTask,
  deleteTemporaryTask
};
