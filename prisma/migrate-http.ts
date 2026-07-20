/**
 * Apply Prisma migrations over Neon's serverless driver (port 443).
 *
 * `prisma migrate deploy` connects on port 5432, which is blocked on this
 * network. This script reproduces its behavior over 443: it ensures the
 * `_prisma_migrations` tracking table exists, then applies every pending
 * migration folder (in order) inside a transaction and records it with the
 * exact sha256 checksum Prisma uses — so a later `migrate deploy` from an
 * unblocked network (e.g. Vercel) sees them as already applied.
 *
 * Run with `pnpm db:migrate:http`.
 */
import "dotenv/config";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Transactional multi-statement DDL needs the WebSocket path (not HTTP fetch).
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL manquant.");
}

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

const CREATE_TRACKING_TABLE = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);`;

async function main(): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(CREATE_TRACKING_TABLE);

    const applied = await pool.query<{ migration_name: string }>(
      `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`,
    );
    const appliedNames = new Set(applied.rows.map((r) => r.migration_name));

    const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    let count = 0;
    for (const name of dirs) {
      if (appliedNames.has(name)) {
        console.info(`⏭️  déjà appliquée : ${name}`);
        continue;
      }
      const sqlPath = join(MIGRATIONS_DIR, name, "migration.sql");
      if (!existsSync(sqlPath)) continue;

      const sql = readFileSync(sqlPath, "utf8");
      const checksum = createHash("sha256").update(sql, "utf8").digest("hex");

      console.info(`▶️  application : ${name}`);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO "_prisma_migrations"
             (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
           VALUES ($1, $2, now(), $3, now(), 1)`,
          [randomUUID(), checksum, name],
        );
        await client.query("COMMIT");
        count += 1;
        console.info(`✅ appliquée : ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    console.info(
      count === 0 ? "Aucune migration en attente." : `${count} migration(s) appliquée(s).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
