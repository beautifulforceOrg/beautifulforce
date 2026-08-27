import { PrismaClient } from "@prisma/client";

// Reuse a single client across hot reloads in dev so each edit doesn't open
// a fresh pool of connections against the database.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
