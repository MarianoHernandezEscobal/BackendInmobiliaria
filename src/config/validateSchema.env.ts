import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DB_HOST: Joi.string().hostname().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  PAGE_SIZE: Joi.number().default(10),

  CORS_ORIGIN: Joi.string().default('*'),

  URL_INMO: Joi.string().uri().required(),
  FACEBOOK_URL: Joi.string().uri().required(),
  FACEBOOK_PAGE_ID: Joi.string().required(),
  FACEBOOK_APP_ID: Joi.string().required(),
  FACEBOOK_APP_SECRET: Joi.string().required(),
  FACEBOOK_ACCESSTOKEN: Joi.string().required(),
  FACEBOOK_USER_ACCESSTOKEN: Joi.string().required(),
});
