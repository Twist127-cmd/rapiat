import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import type { UserScope } from "@/server/user-db";
import type { ProfileInput, PasswordInput } from "@/modules/settings/schemas";

const BCRYPT_ROUNDS = 12;

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      currency: input.currency,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
    },
  });
}

export async function changePassword(userId: string, input: PasswordInput): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new DomainError("NOT_FOUND", "Utilisateur introuvable.");
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new DomainError("INVALID", "Mot de passe actuel incorrect.");
  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
}

/** Delete the user and all their data (cascades via FK). Irreversible. */
export async function deleteAccountData(userId: string): Promise<void> {
  await db.user.delete({ where: { id: userId } });
}

/** Assemble a full export of the user's data (RGPD portability). */
export async function exportAllData({ db: userDb }: UserScope, userId: string) {
  const profile = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      currency: true,
      timezone: true,
      dateFormat: true,
      createdAt: true,
    },
  });
  const [accounts, categories, transactions, recurring, budgets, savingsGoals] = await Promise.all([
    userDb.account.findMany(),
    userDb.category.findMany(),
    userDb.transaction.findMany(),
    userDb.recurringRule.findMany(),
    userDb.budget.findMany(),
    userDb.savingsGoal.findMany(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile,
    accounts,
    categories,
    transactions,
    recurring,
    budgets,
    savingsGoals,
  };
}
