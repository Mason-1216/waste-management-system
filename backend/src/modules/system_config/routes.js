import { checkRole } from '../../middlewares/permission.js';
import * as systemConfigController from './controllers/systemConfigController.js';

export function registerSystemConfigRoutes(router) {
  router.get('/system-configs', checkRole(['admin', 'dev_test']), systemConfigController.listSystemConfigs);
  router.get('/system-configs/:key', checkRole(['admin', 'dev_test']), systemConfigController.getSystemConfig);
  router.put('/system-configs/:key', checkRole(['admin', 'dev_test']), systemConfigController.upsertSystemConfig);
}

export default { registerSystemConfigRoutes };
