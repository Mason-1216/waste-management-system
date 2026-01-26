import { registerTaskConfigRoutes } from './task_config_routes.js';
import { registerPositionTaskRoutes } from './position_task_routes.js';
import { registerDailyTaskRoutes } from './daily_task_routes.js';
import { registerTemporaryTaskRoutes } from './temporary_task_routes.js';
import { registerTemporaryTaskLibraryRoutes } from './temporary_task_library_routes.js';
import { registerPositionJobRoutes } from './position_job_routes.js';
import { registerPositionWorkLogRoutes } from './position_work_log_routes.js';

export const registerTaskRoutes = (router) => {
  registerTaskConfigRoutes(router);
  registerPositionTaskRoutes(router);
  registerDailyTaskRoutes(router);
  registerTemporaryTaskRoutes(router);
  registerTemporaryTaskLibraryRoutes(router);
  registerPositionJobRoutes(router);
  registerPositionWorkLogRoutes(router);
};
