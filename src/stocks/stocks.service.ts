import httpStatus from "http-status";
import AppError from "../utils/applicationError";
import prisma from "../client";
import { Prisma } from "@prisma/client";
import { Stocks } from "./stocks.entity";
import { IHistoryService } from "../shared/history.service";
import { CreateStocksDTO } from "./dto/createStocks.dto";
import { UpdateStocksQuantityDTO } from "./dto/updateStocks.dto";

export class StocksService {
  private readonly historyService: IHistoryService;

  constructor(historyService: IHistoryService) {
    this.historyService = historyService;
  }

  createStocks = async (dto: CreateStocksDTO): Promise<Stocks> => {
    try {
      const isPLUExist =
        (await prisma.products.count({
          where: {
            plu: dto.plu,
          },
        })) > 0;

      if (!isPLUExist) {
        throw new AppError(httpStatus.BAD_REQUEST, `PLU #${dto.plu} не найден`);
      }
      await prisma.stocks.create({
        data: {
          plu: dto.plu,
          shopId: dto.shopId,
          onShelfQuantity: dto.onShelfQuantity,
          inOrdersQuantity: dto.inOrdersQuantity,
        },
      });

      await this.historyService.send({
        action: "createStocks",
        plu: dto.plu,
        shopId: dto.shopId,
      });

      return {
        plu: dto.plu,
        shopId: dto.shopId,
        onShelfQuantity: dto.onShelfQuantity,
        inOrdersQuantity: dto.inOrdersQuantity,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          throw new AppError(httpStatus.BAD_REQUEST, "Уже создано");
        }
      }
      throw e;
    }
  };

  incrementOnShelfStocks = async (
    dto: UpdateStocksQuantityDTO
  ): Promise<Stocks> => {
    try {
      const updated = await prisma.stocks.update({
        where: {
          plu_shopId: {
            plu: dto.plu,
            shopId: dto.shopId,
          },
        },
        data: {
          onShelfQuantity: { increment: dto.quantity },
        },
      });

      await this.historyService.send({
        action: "incrementOnShelfStocks",
        plu: dto.plu,
        shopId: dto.shopId,
      });

      return {
        plu: updated.plu,
        shopId: updated.shopId,
        onShelfQuantity: updated.onShelfQuantity,
        inOrdersQuantity: updated.inOrdersQuantity,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2001") {
          throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
        }
      }
      throw e;
    }
  };

  decrementOnShelfStocks = async (
    dto: UpdateStocksQuantityDTO
  ): Promise<Stocks> => {
    return prisma.$transaction(async (tx) => {
      try {
        const result = await tx.$queryRaw<
          {
            on_shelf_quantity: number;
          }[]
        >`SELECT on_shelf_quantity FROM stocks WHERE plu = ${dto.plu} AND shop_id = ${dto.shopId} FOR UPDATE`;
        if (result.length === 0) {
          throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
        }
        if (dto.quantity > result[0].on_shelf_quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Остатки не могу быть отрицательными"
          );
        }
        const updated = await tx.stocks.update({
          where: {
            plu_shopId: {
              plu: dto.plu,
              shopId: dto.shopId,
            },
          },
          data: {
            onShelfQuantity: { decrement: dto.quantity },
          },
        });

        await this.historyService.send({
          action: "decrementOnShelfStocks",
          plu: dto.plu,
          shopId: dto.shopId,
        });

        return {
          plu: updated.plu,
          shopId: updated.shopId,
          onShelfQuantity: updated.onShelfQuantity,
          inOrdersQuantity: updated.inOrdersQuantity,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2001") {
            throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
          }
        }
        throw e;
      }
    });
  };

  incrementInOrdersStocks = async (
    dto: UpdateStocksQuantityDTO
  ): Promise<Stocks> => {
    try {
      const updated = await prisma.stocks.update({
        where: {
          plu_shopId: {
            plu: dto.plu,
            shopId: dto.shopId,
          },
        },
        data: {
          inOrdersQuantity: { increment: dto.quantity },
        },
      });

      await this.historyService.send({
        action: "incrementInOrdersStocks",
        plu: dto.plu,
        shopId: dto.shopId,
      });

      return {
        plu: updated.plu,
        shopId: updated.shopId,
        onShelfQuantity: updated.onShelfQuantity,
        inOrdersQuantity: updated.inOrdersQuantity,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2001") {
          throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
        }
      }
      throw e;
    }
  };

  decrementInOrdersStocks = async (
    dto: UpdateStocksQuantityDTO
  ): Promise<Stocks> => {
    return prisma.$transaction(async (tx) => {
      try {
        const result = await tx.$queryRaw<
          {
            in_orders_quantity: number;
          }[]
        >`SELECT in_orders_quantity FROM stocks WHERE plu = ${dto.plu} AND shop_id = ${dto.shopId} FOR UPDATE`;
        if (result.length === 0) {
          throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
        }
        if (dto.quantity > result[0].in_orders_quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Остатки не могу быть отрицательными"
          );
        }
        const updated = await tx.stocks.update({
          where: {
            plu_shopId: {
              plu: dto.plu,
              shopId: dto.shopId,
            },
          },
          data: {
            inOrdersQuantity: { decrement: dto.quantity },
          },
        });

        await this.historyService.send({
          action: "decrementInOrdersStocks",
          plu: dto.plu,
          shopId: dto.shopId,
        });

        return {
          plu: updated.plu,
          shopId: updated.shopId,
          onShelfQuantity: updated.onShelfQuantity,
          inOrdersQuantity: updated.inOrdersQuantity,
        };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2001") {
            throw new AppError(httpStatus.BAD_REQUEST, "Не найдено");
          }
        }
        throw e;
      }
    });
  };

  getStocks = async (filters: {
    plu?: number;
    shopId?: number;
    stocksOnShelfFrom?: number;
    stocksOnShelfTo?: number;
    stocksInOrdersFrom?: number;
    stocksInOrdersTo?: number;
  }): Promise<Stocks[]> => {
    return await prisma.stocks.findMany({
      where: {
        plu: filters.plu,
        shopId: filters.shopId,
        onShelfQuantity: {
          gte: filters.stocksOnShelfFrom,
          lte: filters.stocksOnShelfTo,
        },
        inOrdersQuantity: {
          gte: filters.stocksInOrdersFrom,
          lte: filters.stocksInOrdersTo,
        },
      },
    });
  };
}
