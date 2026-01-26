import feedbackController from '../../controllers/feedbackController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerFeedbackRoutes = (router) => {
  router.get('/feedback', checkRole(['admin']), feedbackController.getFeedbacks);
  router.post('/feedback', feedbackController.submitFeedback);
};
