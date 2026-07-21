/**
 * Create (or promote) a super-admin account.
 *
 *   pnpm tsx scripts/set-superadmin.ts <email> [password]
 *
 * - Existing user → promoted to super-admin (password updated only if given).
 * - New user      → created as super-admin; a strong password is generated and
 *                   printed once if none is provided.
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) throw new Error("DATABASE_URL manquant.");

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

function strongPassword(): string {
  // 18 URL-safe chars — comfortably above the 8-char minimum.
  return randomBytes(14).toString("base64url").slice(0, 18);
}

async function main(): Promise<void> {
  const email = (process.argv[2] || "admin@rapiat.ch").trim().toLowerCase();
  const providedPassword = process.argv[3];
  const password = providedPassword || strongPassword();

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { email },
      data: {
        isSuperAdmin: true,
        ...(providedPassword ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
    console.info(`✅ ${email} est maintenant super-admin.`);
    if (providedPassword) console.info(`   Mot de passe mis à jour.`);
  } else {
    await db.user.create({
      data: {
        email,
        name: "Super Admin",
        passwordHash: await bcrypt.hash(password, 12),
        isSuperAdmin: true,
      },
    });
    console.info("✅ Compte super-admin créé.");
    console.info("──────────────────────────────────────────");
    console.info(`   E-mail        : ${email}`);
    console.info(`   Mot de passe  : ${password}`);
    console.info("──────────────────────────────────────────");
    console.info("   (Notez-le : il ne sera plus affiché.)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
