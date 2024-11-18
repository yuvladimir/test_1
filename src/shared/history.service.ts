import logger from "../config/logger";

export interface IHistoryService {
  send(data: HistoryServiceActionData): Promise<void>;
}

export type HistoryServiceActionData = {
  action:
    | "createProduct"
    | "createStocks"
    | "incrementOnShelfStocks"
    | "decrementOnShelfStocks"
    | "incrementInOrdersStocks"
    | "decrementInOrdersStocks";
  plu: number;
  shopId?: number;
};

export class HistoryServiceImpl implements IHistoryService {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send(data: HistoryServiceActionData): Promise<void> {
    try {
      await fetch(this.url, {
        method: "post",
        body: JSON.stringify(data),
        keepalive: true,
      });
    } catch (error) {
      logger.error(error);
    }
  }
}
