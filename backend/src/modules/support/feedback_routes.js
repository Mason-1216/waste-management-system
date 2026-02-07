import feedbackController from './controllers/feedbackController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerFeedbackRoutes = (router) => {
  router.get('/feedback', checkRole(['admin']), feedbackController.getFeedbacks);
  router.get('/feedback/unread-count', checkRole(['admin']), feedbackController.getFeedbackUnreadCount);
  router.post('/feedback', feedbackController.submitFeedback);
};
