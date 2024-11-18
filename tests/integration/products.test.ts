import request from "supertest";
import httpStatus from "http-status";
import setupTestDB from "../utils/setupTestDb";
import { describe, beforeEach, test, expect, jest } from "@jest/globals";
import prisma from "../../src/client";
import { createApp } from "../app";
import { HistoryService } from "../history.service";

const historyService = new HistoryService();
const app = createApp({ historyService });
type CreateProductDTO = { plu: number; name?: string };

setupTestDB();

describe("Product routes", () => {
  beforeEach(() => {
    jest.spyOn(historyService, "send").mockClear();
  });

  describe("POST /products", () => {
    test("Должен вернуть 201. Продукт создан", async () => {
      const product: CreateProductDTO = { plu: 45788, name: "Test" };
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/products")
        .send(product)
        .expect(httpStatus.CREATED);
      expect(res.body).toEqual({
        plu: product.plu,
        name: product.name,
      });
      expect(spySend).toBeCalledTimes(1);
    });

    test("Создание товара без данных. Должен вернуть 400.", async () => {
      const spySend = jest.spyOn(historyService, "send");
      const res = await request(app)
        .post("/products")
        .send()
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        code: 400,
        message: '"plu" is required, "name" is required',
      });
      expect(spySend).toBeCalledTimes(0);
    });

    test("Создание одинакового продукта. Должен вернуть 400 (Продукт уже добавлен)", async () => {
      const product: CreateProductDTO = { plu: 45788, name: "Test" };
      const spySend = jest.spyOn(historyService, "send");
      await request(app)
        .post("/products")
        .send(product)
        .expect(httpStatus.CREATED);
      jest.spyOn(historyService, "send").mockClear();
      const res = await request(app)
        .post("/products")
        .send(product)
        .expect(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        code: 400,
        message: "Продукт уже добавлен",
      });
      expect(spySend).toBeCalledTimes(0);
    });
  });

  describe("GET /products", () => {
    beforeEach(async () => {
      await prisma.products.create({
        data: {
          plu: 3000,
          name: "Яблоки",
        },
      });
      await prisma.products.create({
        data: {
          plu: 4000,
          name: "Бананы",
        },
      });
    });

    test("Возврат всех товаров. Без фильтров", async () => {
      const res = await request(app)
        .get("/products")
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(2);
    });

    test("Возврат товаров по фильтру plu", async () => {
      const res = await request(app)
        .get("/products?plu=3000")
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]["plu"]).toBe(3000);
    });

    test("Возврат товаров по фильтру name", async () => {
      const res = await request(app)
        .get(encodeURI(`/products?name=бананы`))
        .send()
        .expect(httpStatus.OK);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]["plu"]).toBe(4000);
    });
  });
});
