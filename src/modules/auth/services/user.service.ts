import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { DEFAULT_CATEGORIES } from "@/config/default-categories";
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/config/constants";
import type { SignupInput } from "@/modules/auth/schemas";

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user: hashes the password, creates the account, and
 * provisions the default categories plus a first checking account so the app
 * is usable immediately. Runs in a transaction so a partial signup never
 * leaves an account without its starter data.
 */
export async function registerUser(input: SignupInput): Promise<{ id: string; email: string }> {
  const email = input.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    // Anti-enumeration: the action maps this to a generic message.
    throw new DomainError("EMAIL_TAKEN", "Un compte existe déjà avec cette adresse e-mail.");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash,
        currency: DEFAULT_CURRENCY,
        timezone: DEFAULT_TIMEZONE,
      },
      select: { id: true, email: true },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        userId: created.id,
        name: c.name,
        kind: c.kind,
        color: c.color,
        icon: c.icon,
        isDefault: true,
      })),
    });

    await tx.account.create({
      data: {
        userId: created.id,
        name: "Compte courant",
        type: "CHECKING",
        initialBalanceCents: 0,
        currency: DEFAULT_CURRENCY,
        color: "#1e2a4a",
        icon: "wallet",
      },
    });

    return created;
  });

  return user;
}
