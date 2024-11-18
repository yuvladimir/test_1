import {
  IHistoryService,
  HistoryServiceActionData,
} from "../src/shared/history.service";

export class HistoryService implements IHistoryService {
  async send(_data: HistoryServiceActionData): Promise<void> {
    return Promise.resolve();
  }
}
