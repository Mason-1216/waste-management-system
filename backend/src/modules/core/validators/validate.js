import Joi from 'joi';

// Controllers can validate ctx.query/ctx.params/ctx.request.body without changing
// response format. backend/src/middlewares/error.js already handles Joi errors.

export const validate = async (schema, value, options = {}) => {
  return await schema.validateAsync(value, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
    ...options
  });
};

export const validateQuery = async (ctx, schema, options = {}) => {
  const v = await validate(schema, ctx.query ?? {}, options);
  ctx.query = v;
  return v;
};

export const validateParams = async (ctx, schema, options = {}) => {
  const v = await validate(schema, ctx.params ?? {}, options);
  ctx.params = v;
  return v;
};

export const validateBody = async (ctx, schema, options = {}) => {
  const v = await validate(schema, ctx.request?.body ?? {}, options);
  if (!ctx.request) ctx.request = {};
  ctx.request.body = v;
  return v;
};

export { Joi };

export default { Joi, validate, validateQuery, validateParams, validateBody };
