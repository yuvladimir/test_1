import Joi from "joi";

export const createProductBody = {
  body: Joi.object().keys({
    plu: Joi.number().integer().required(),
    name: Joi.string().required(),
  }),
};

export type CreateProductBody = {
  plu: number;
  name: string;
};

export const getProductsQuery = {
  query: Joi.object().keys({
    plu: Joi.number().integer(),
    name: Joi.string(),
  }),
};

export type GetProductsQuery = {
  plu?: number;
  name?: string;
};
