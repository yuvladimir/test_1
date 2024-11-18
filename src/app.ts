import express from "express";
import httpStatus from "http-status";
import config from "./config/config";
import { errorConverter, errorHandler } from "./middlewares/error";
import AppError from "./utils/applicationError";
import { HistoryServiceImpl } from "./shared/history.service";
import ProductController from "./products/product.controller";
import StocksController from "./stocks/stocks.controller";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
ProductController.boot(app, new HistoryServiceImpl(config.historyServiceUrl));
StocksController.boot(app, new HistoryServiceImpl(config.historyServiceUrl));
app.use((req, res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, "Not found"));
});
app.use(errorConverter);
app.use(errorHandler);

export default app;
