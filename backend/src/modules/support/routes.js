import { registerFeedbackRoutes } from './feedback_routes.js';
import { registerUploadRoutes } from './upload_routes.js';

export const registerSupportRoutes = (router) => {
  registerFeedbackRoutes(router);
  registerUploadRoutes(router);
};
