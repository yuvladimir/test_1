import Joi from "joi";

export const createStocksBody = {
  body: Joi.object().keys({
    plu: Joi.number().integer().required(),
    shopId: Joi.number().integer().required(),
    onShelfQuantity: Joi.number().integer().min(0).required(),
    inOrdersQuantity: Joi.number().integer().min(0).required(),
  }),
};

export type CreateStocksBody = {
  plu: number;
  shopId: number;
  onShelfQuantity: number;
  inOrdersQuantity: number;
};

export const updateStocksQuantityBody = {
  body: Joi.object().keys({
    plu: Joi.number().integer().required(),
    shopId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
  }),
};

export type UpdateStocksQuantityBody = {
  plu: number;
  shopId: number;
  quantity: number;
};

export const getStocksQuery = {
  query: Joi.object().keys({
    plu: Joi.number().integer(),
    shop_id: Joi.number().integer(),
    stocks_on_shelf_from: Joi.number().integer(),
    stocks_on_shelf_to: Joi.number().integer(),
    stocks_in_orders_from: Joi.number().integer(),
    stocks_in_orders_to: Joi.number().integer(),
  }),
};

export type GetStocksQuery = {
  plu?: number;
  shop_id?: number;
  stocks_on_shelf_from?: number;
  stocks_on_shelf_to?: number;
  stocks_in_orders_from?: number;
  stocks_in_orders_to?: number;
};
