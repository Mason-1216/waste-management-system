import { registerApprovalActionRoutes } from './approvals_routes.js';
import { registerNotificationRoutes } from './notification_routes.js';

export const registerApprovalRoutes = (router) => {
  registerApprovalActionRoutes(router);
  registerNotificationRoutes(router);
};
