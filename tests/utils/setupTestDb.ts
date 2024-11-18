import prisma from "../../src/client";
import { beforeAll, beforeEach, afterAll } from "@jest/globals";

const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.stocks.deleteMany();
    await prisma.products.deleteMany();
  });

  afterAll(async () => {
    await prisma.stocks.deleteMany();
    await prisma.products.deleteMany();
    await prisma.$disconnect();
  });
};

export default setupTestDB;
