import * as positionJobService from '../modules/task/services/positionJobService.js';

export const getPositionJobs = positionJobService.getPositionJobs;
export const getPositionNames = positionJobService.getPositionNames;
export const getPositionJobsByPosition = positionJobService.getPositionJobsByPosition;
export const createPositionJob = positionJobService.createPositionJob;
export const updatePositionJob = positionJobService.updatePositionJob;
export const deletePositionJob = positionJobService.deletePositionJob;
export const getPositionJobsTemplate = positionJobService.getPositionJobsTemplate;
export const importPositionJobs = positionJobService.importPositionJobs;

export default {
  getPositionJobs,
  getPositionNames,
  getPositionJobsByPosition,
  createPositionJob,
  updatePositionJob,
  deletePositionJob,
  getPositionJobsTemplate,
  importPositionJobs
};
