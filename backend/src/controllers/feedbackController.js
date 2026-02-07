import * as feedbackService from '../modules/support/services/feedbackService.js';

export const submitFeedback = feedbackService.submitFeedback;
export const getFeedbacks = feedbackService.getFeedbacks;
export const getFeedbackUnreadCount = feedbackService.getFeedbackUnreadCount;

export default {
  submitFeedback,
  getFeedbacks,
  getFeedbackUnreadCount
};
