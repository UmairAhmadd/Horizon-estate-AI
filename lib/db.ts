import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client — server-only, and only instantiated when DATABASE_URL is set.
 * The whole app works without a database (localStorage / in-memory mock); this
 * module simply returns null when there's no DATABASE_URL, and every caller
 * degrades gracefully. Credentials never reach the client bundle.
 */

export const dbEnabled = Boolean(process.env.DATABASE_URL);

// Reuse a single client across hot reloads / requests in dev.
const globalForPrisma = globalThis as unknown as {
  __horizonPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient | null {
  if (!dbEnabled) return null;
  if (!globalForPrisma.__horizonPrisma) {
    globalForPrisma.__horizonPrisma = new PrismaClient();
  }
  return globalForPrisma.__horizonPrisma;
}
