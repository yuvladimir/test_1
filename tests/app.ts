import express from "express";
import httpStatus from "http-status";
import { errorConverter, errorHandler } from "../src/middlewares/error";
import AppError from "../src/utils/applicationError";
import { IHistoryService } from "../src/shared/history.service";
import ProductController from "../src/products/product.controller";
import StocksController from "../src/stocks/stocks.controller";

export function createApp({
  historyService,
}: {
  historyService: IHistoryService;
}) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  ProductController.boot(app, historyService);
  StocksController.boot(app, historyService);
  app.use((req, res, next) => {
    next(new AppError(httpStatus.NOT_FOUND, "Not found"));
  });
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
}
