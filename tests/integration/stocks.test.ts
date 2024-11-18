import request from "supertest";
import httpStatus from "http-status";
import setupTestDB from "../utils/setupTestDb";
import { describe, beforeEach, test, expect, jest } from "@jest/globals";
import prisma from "../../src/client";
import { createApp } from "../app";
import { HistoryService } from "../history.service";
import { CreateStocksDTO } from "../../src/stocks/dto/createStocks.dto";

const historyService = new HistoryService();
const app = createApp({ historyService });

setupTestDB();

describe("Stocks routes", () => {
  beforeEach(async () => {
    jest.spyOn(historyService, "send").mockClear();
    await prisma.products.create({
      data: {
        plu: 3000,
        name: "Яблоки",
      },
    });
  });

  describe("POST /stocks", () => {
    test("Должен вернуть 201. Остатки созданы", async () => {
      const stocks: CreateStocksDTO = {
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 0,
        inOrdersQuantity: 0,
      };
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks")
        .send(stocks)
        .expect(httpStatus.CREATED);
      expect(res.body).toEqual({
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 0,
        inOrdersQuantity: 0,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Создание остатка, ели нет товара. Должен вернуть 400.", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const stocks: CreateStocksDTO = {
        plu: 4000,
        shopId: 1,
        onShelfQuantity: 0,
        inOrdersQuantity: 0,
      };
      const res = await request(app)
        .post("/stocks")
        .send(stocks)
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        code: 400,
        message: "PLU #4000 не найден",
      });
      expect(spySend).toBeCalledTimes(0);
    });

    test("Создание одинакового остатка. Должен вернуть 400 (Продукт уже добавлен)", async () => {
      await prisma.stocks.create({
        data: {
          plu: 3000,
          shopId: 1,
          onShelfQuantity: 0,
          inOrdersQuantity: 0,
        },
      });
      const stocks: CreateStocksDTO = {
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 0,
        inOrdersQuantity: 0,
      };
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks")
        .send(stocks)
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        code: 400,
        message: "Уже создано",
      });
      expect(spySend).toBeCalledTimes(0);
    });

    test("Создание остатка с отрицательным значением. Должен вернуть 400", async () => {
      const stocks: CreateStocksDTO = {
        plu: 3000,
        shopId: 1,
        onShelfQuantity: -1,
        inOrdersQuantity: -1,
      };
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks")
        .send(stocks)
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        code: 400,
        message:
          '"onShelfQuantity" must be greater than or equal to 0, "inOrdersQuantity" must be greater than or equal to 0',
      });
      expect(spySend).toBeCalledTimes(0);
    });
  });

  describe("GET /stocks", () => {
    beforeEach(async () => {
      await prisma.stocks.create({
        data: {
          plu: 3000,
          shopId: 1,
          onShelfQuantity: 10,
          inOrdersQuantity: 5,
        },
      });
      await prisma.stocks.create({
        data: {
          plu: 4000,
          shopId: 2,
          onShelfQuantity: 20,
          inOrdersQuantity: 15,
        },
      });
    });
    test("Возврат всех товаров. Без фильтров", async () => {
      const res = await request(app)
        .get("/stocks")
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(2);
    });
    test("Возврат товаров по фильтру plu", async () => {
      const res = await request(app)
        .get(encodeURI("/stocks?plu=3000"))
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
    });
    test("Возврат товаров по фильтру shopId", async () => {
      const res = await request(app)
        .get(encodeURI("/stocks?shop_id=1"))
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
    });

    test("Возврат товаров по фильтру stocks_on_shelf", async () => {
      const res = await request(app)
        .get(encodeURI("/stocks?stocks_on_shelf_from=11"))
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
      const res2 = await request(app)
        .get(encodeURI("/stocks?stocks_on_shelf_from=11&stocks_on_shelf_to=20"))
        .send()
        .expect(httpStatus.OK);
      expect(res2.body).toHaveLength(1);
    });

    test("Возврат товаров по фильтру stocks_in_orders", async () => {
      const res = await request(app)
        .get(encodeURI("/stocks?stocks_in_orders_from=6"))
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
      const res2 = await request(app)
        .get(
          encodeURI("/stocks?stocks_in_orders_from=6&stocks_in_orders_to=20")
        )
        .send()
        .expect(httpStatus.OK);
      expect(res2.body).toHaveLength(1);
    });
  });

  describe("POST /stocks/*/(increment/decrement)", () => {
    beforeEach(async () => {
      await prisma.stocks.create({
        data: {
          plu: 3000,
          shopId: 1,
          onShelfQuantity: 1,
          inOrdersQuantity: 1,
        },
      });
    });
    test("Увеличение остатка / onShelf", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks/on-shelf/increment")
        .send({ plu: 3000, shopId: 1, quantity: 1 })
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 2,
        inOrdersQuantity: 1,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Уменьшение остатка / onShelf", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks/on-shelf/decrement")
        .send({ plu: 3000, shopId: 1, quantity: 1 })
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 0,
        inOrdersQuantity: 1,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Уменьшение остатка / onShelf / Меньше 0", async () => {
      const spySend = jest.spyOn(historyService, "send");
      await request(app)
        .post("/stocks/on-shelf/decrement")
        .send({ plu: 3000, shopId: 1, quantity: 2 })
        .expect(httpStatus.BAD_REQUEST);
      expect(spySend).toBeCalledTimes(0);
    });

    test("Увеличение остатка / inOrders", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks/in-orders/increment")
        .send({ plu: 3000, shopId: 1, quantity: 1 })
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 1,
        inOrdersQuantity: 2,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Уменьшение остатка / inOrders", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/stocks/in-orders/decrement")
        .send({ plu: 3000, shopId: 1, quantity: 1 })
        .expect(httpStatus.OK);
      expect(res.body).toEqual({
        plu: 3000,
        shopId: 1,
        onShelfQuantity: 1,
        inOrdersQuantity: 0,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Уменьшение остатка / inOrders / Меньше 0", async () => {
      const spySend = jest.spyOn(historyService, "send");
      await request(app)
        .post("/stocks/in-orders/decrement")
        .send({ plu: 3000, shopId: 1, quantity: 2 })
        .expect(httpStatus.BAD_REQUEST);
      expect(spySend).toBeCalledTimes(0);
    });
  });
});
