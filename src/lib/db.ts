import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma client singleton.
 *
 * Connects through Neon's serverless driver over HTTPS/WebSocket (port 443)
 * rather than the raw Postgres protocol (port 5432) — required because Neon's
 * network and many deployment platforms block 5432. `poolQueryViaFetch` routes
 * simple queries over HTTP fetch (fast, serverless-friendly); a `ws`
 * implementation is supplied for the transactional WebSocket path in Node.
 *
 * NOTE: this is the RAW client. Business code must never import it directly —
 * it goes through the user-scoped data-access layer (see server/user-db.ts).
 */
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const createPrismaClient = (): PrismaClient => {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
