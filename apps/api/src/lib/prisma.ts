import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let _prisma: PrismaClient;

try {
  _prisma =
    global.prisma ??
    new PrismaClient({ log: ["error", "warn"] });

  if (process.env.NODE_ENV !== "production") {
    global.prisma = _prisma;
  }
} catch (err) {
  console.error("[prisma] PrismaClient init failed:", (err as Error).message);
  console.error((err as Error).stack);
  // Re-throw so the real error appears in logs before process exits
  throw err;
}

export const prisma = _prisma!;
