import positionJobController from './controllers/positionJobController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../file_storage/upload.js';

export const registerPositionJobRoutes = (router) => {
  router.get('/position-jobs', positionJobController.getPositionJobs);
  router.get('/position-jobs/positions', positionJobController.getPositionNames);
  router.get('/position-jobs/by-position', positionJobController.getPositionJobsByPosition);
  router.post(
    '/position-jobs',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    positionJobController.createPositionJob
  );
  router.put(
    '/position-jobs/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    positionJobController.updatePositionJob
  );
  router.delete(
    '/position-jobs/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    positionJobController.deletePositionJob
  );
  router.get(
    '/position-jobs/template',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    positionJobController.getPositionJobsTemplate
  );
  router.post(
    '/position-jobs/import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    positionJobController.importPositionJobs
  );
  router.post(
    '/position-jobs/import-preview',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    positionJobController.previewImportPositionJobs
  );
};
