import { Joi } from '../../core/validators/validate.js';

export const submitFeedbackBodySchema = Joi.object({
  type: Joi.string().max(50).required(),
  content: Joi.string().max(5000).required(),
  contact: Joi.string().allow('').max(200).optional(),
  images: Joi.array().items(Joi.string().max(500)).optional()
});

export default { submitFeedbackBodySchema };
