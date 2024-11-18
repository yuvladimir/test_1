import httpStatus from "http-status";
import { Express } from "express";
import catchAsync from "../utils/catchAsync";
import { IHistoryService } from "../shared/history.service";
import validate from "../middlewares/validate";
import {
  getStocksQuery,
  createStocksBody,
  updateStocksQuantityBody,
  GetStocksQuery,
  CreateStocksBody,
  UpdateStocksQuantityBody,
} from "./stocks.validation";
import { StocksService } from "./stocks.service";

export default class StocksController {
  static boot(app: Express, historyService: IHistoryService) {
    const stocksController = new StocksController(
      new StocksService(historyService)
    );
    app.get("/stocks", validate(getStocksQuery), stocksController.getStocks);
    app.post(
      "/stocks",
      validate(createStocksBody),
      stocksController.createStocks
    );
    app.post(
      "/stocks/on-shelf/increment",
      validate(updateStocksQuantityBody),
      stocksController.incrementOnShelfStocks
    );
    app.post(
      "/stocks/on-shelf/decrement",
      validate(updateStocksQuantityBody),
      stocksController.decrementOnShelfStocks
    );
    app.post(
      "/stocks/in-orders/increment",
      validate(updateStocksQuantityBody),
      stocksController.incrementInOrdersStocks
    );
    app.post(
      "/stocks/in-orders/decrement",
      validate(updateStocksQuantityBody),
      stocksController.decrementInOrdersStocks
    );
  }

  private readonly stocksService: StocksService;

  constructor(stocksService: StocksService) {
    this.stocksService = stocksService;
  }

  createStocks = catchAsync(async (req, res) => {
    const { plu, shopId, onShelfQuantity, inOrdersQuantity } =
      req.body as CreateStocksBody;
    const stock = await this.stocksService.createStocks({
      plu,
      shopId,
      onShelfQuantity,
      inOrdersQuantity,
    });
    res.status(httpStatus.CREATED).send(stock);
  });

  incrementOnShelfStocks = catchAsync(async (req, res) => {
    const { plu, shopId, quantity } = req.body as UpdateStocksQuantityBody;
    const stock = await this.stocksService.incrementOnShelfStocks({
      plu,
      shopId,
      quantity,
    });
    res.send(stock);
  });

  decrementOnShelfStocks = catchAsync(async (req, res) => {
    const { plu, shopId, quantity } = req.body as UpdateStocksQuantityBody;
    const stock = await this.stocksService.decrementOnShelfStocks({
      plu,
      shopId,
      quantity,
    });
    res.send(stock);
  });

  incrementInOrdersStocks = catchAsync(async (req, res) => {
    const { plu, shopId, quantity } = req.body as UpdateStocksQuantityBody;
    const stock = await this.stocksService.incrementInOrdersStocks({
      plu,
      shopId,
      quantity,
    });
    res.send(stock);
  });

  decrementInOrdersStocks = catchAsync(async (req, res) => {
    const { plu, shopId, quantity } = req.body as UpdateStocksQuantityBody;
    const stock = await this.stocksService.decrementInOrdersStocks({
      plu,
      shopId,
      quantity,
    });
    res.send(stock);
  });

  getStocks = catchAsync(async (req, res) => {
    const {
      plu,
      shop_id,
      stocks_on_shelf_from,
      stocks_on_shelf_to,
      stocks_in_orders_from,
      stocks_in_orders_to,
    } = req.query as GetStocksQuery;
    const stock = await this.stocksService.getStocks({
      plu,
      shopId: shop_id,
      stocksOnShelfFrom: stocks_on_shelf_from,
      stocksOnShelfTo: stocks_on_shelf_to,
      stocksInOrdersFrom: stocks_in_orders_from,
      stocksInOrdersTo: stocks_in_orders_to,
    });
    res.send(stock);
  });
}
