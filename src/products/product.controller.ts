import httpStatus from "http-status";
import { Express } from "express";
import catchAsync from "../utils/catchAsync";
import { IHistoryService } from "../shared/history.service";
import validate from "../middlewares/validate";
import {
  createProductBody,
  getProductsQuery,
  CreateProductBody,
  GetProductsQuery,
} from "./product.validations";
import { ProductService } from "./product.service";

export default class ProductController {
  static boot(app: Express, historyService: IHistoryService) {
    const productController = new ProductController(
      new ProductService(historyService)
    );
    app.post(
      "/products",
      validate(createProductBody),
      productController.createProduct
    );
    app.get(
      "/products",
      validate(getProductsQuery),
      productController.getProducts
    );
  }

  private readonly productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }
  createProduct = catchAsync(async (req, res) => {
    const { plu, name } = req.body as CreateProductBody;
    const product = await this.productService.createProduct(plu, name);
    res.status(httpStatus.CREATED).send(product);
  });

  getProducts = catchAsync(async (req, res) => {
    const { plu, name } = req.query as GetProductsQuery;
    const product = await this.productService.getProducts(plu, name);
    res.send(product);
  });
}
