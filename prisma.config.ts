import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration. Connection URLs no longer live in the schema.
 *
 * Migrations use a DIRECT (non-pooled) connection when available — required by
 * Neon, whose pooled endpoint (pgbouncer) does not support the DDL/advisory
 * locks Prisma Migrate needs. At runtime, the app instead uses the pooled
 * DATABASE_URL through the driver adapter in `src/lib/db.ts`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
