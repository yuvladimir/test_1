import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import AppError from "../utils/applicationError";
import prisma from "../client";
import { Product } from "./product.entity";
import { IHistoryService } from "../shared/history.service";

export class ProductService {
  private readonly historyService: IHistoryService;

  constructor(historyService: IHistoryService) {
    this.historyService = historyService;
  }

  createProduct = async (plu: number, name: string): Promise<Product> => {
    try {
      await prisma.products.create({
        data: {
          plu,
          name,
        },
      });
      await this.historyService.send({
        action: "createProduct",
        plu,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          throw new AppError(httpStatus.BAD_REQUEST, "Продукт уже добавлен");
        }
      }
      throw e;
    }
    return {
      plu,
      name,
    };
  };

  getProducts = async (
    plu: number | undefined,
    name: string | undefined
  ): Promise<Product[]> => {
    return await prisma.products.findMany({
      where: {
        plu,
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
    });
  };
}
