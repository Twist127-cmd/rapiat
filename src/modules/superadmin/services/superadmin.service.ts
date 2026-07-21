import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma/client";
import { registerUser } from "@/modules/auth/services/user.service";
import type {
  AdminAuditResult,
  AdminAuditRow,
  AdminStats,
  AdminUserDetail,
  AdminUserRow,
} from "@/modules/superadmin/types";
import type { AuditFilter } from "@/modules/superadmin/schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Platform-wide counters for the console dashboard. */
export async function getStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - DAY_MS);
  const [userCount, superAdminCount, accountCount, transactionCount, logins24h] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isSuperAdmin: true } }),
    db.account.count(),
    db.transaction.count(),
    db.auditLog.count({ where: { action: "login", createdAt: { gte: since } } }),
  ]);
  return { userCount, superAdminCount, accountCount, transactionCount, logins24h };
}

/** Last successful login per user, keyed by userId. */
async function lastLoginMap(): Promise<Map<string, Date>> {
  const rows = await db.auditLog.groupBy({
    by: ["userId"],
    where: { action: "login", userId: { not: null } },
    _max: { createdAt: true },
  });
  const map = new Map<string, Date>();
  for (const r of rows) {
    if (r.userId && r._max.createdAt) map.set(r.userId, r._max.createdAt);
  }
  return map;
}

/** All users with volume + last login. */
export async function listUsers(): Promise<AdminUserRow[]> {
  const [users, logins] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        currency: true,
        createdAt: true,
        _count: { select: { accounts: true, transactions: true } },
      },
    }),
    lastLoginMap(),
  ]);
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isSuperAdmin: u.isSuperAdmin,
    currency: u.currency,
    createdAt: u.createdAt,
    accountCount: u._count.accounts,
    transactionCount: u._count.transactions,
    lastLoginAt: logins.get(u.id) ?? null,
  }));
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  const u = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      currency: true,
      timezone: true,
      createdAt: true,
      _count: { select: { accounts: true, transactions: true } },
    },
  });
  if (!u) throw new DomainError("NOT_FOUND", "Utilisateur introuvable.");

  const [logins, recentLogs] = await Promise.all([
    lastLoginMap(),
    db.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, userId: true, userEmail: true, action: true, detail: true, createdAt: true },
    }),
  ]);

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isSuperAdmin: u.isSuperAdmin,
    currency: u.currency,
    timezone: u.timezone,
    createdAt: u.createdAt,
    accountCount: u._count.accounts,
    transactionCount: u._count.transactions,
    lastLoginAt: logins.get(u.id) ?? null,
    recentLogs,
  };
}

/** Create a user (with default categories + starter account, via registerUser). */
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  isSuperAdmin?: boolean;
}): Promise<{ id: string; email: string }> {
  const created = await registerUser({
    name: input.name,
    email: input.email,
    password: input.password,
    confirmPassword: input.password,
  });
  if (input.isSuperAdmin) {
    await db.user.update({ where: { id: created.id }, data: { isSuperAdmin: true } });
  }
  return created;
}

export async function resetPassword(id: string, newPassword: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) throw new DomainError("NOT_FOUND", "Utilisateur introuvable.");
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return user.email;
}

/** Promote/demote; refuses to remove the last remaining super-admin. */
export async function setSuperAdmin(id: string, value: boolean): Promise<string> {
  const user = await db.user.findUnique({ where: { id }, select: { email: true, isSuperAdmin: true } });
  if (!user) throw new DomainError("NOT_FOUND", "Utilisateur introuvable.");
  if (!value && user.isSuperAdmin) {
    const count = await db.user.count({ where: { isSuperAdmin: true } });
    if (count <= 1) {
      throw new DomainError("LAST_ADMIN", "Impossible : c'est le dernier super-admin.");
    }
  }
  await db.user.update({ where: { id }, data: { isSuperAdmin: value } });
  return user.email;
}

/** Delete a user and all their data (cascade). Refuses the last super-admin. */
export async function deleteUser(id: string, actingUserId: string): Promise<string> {
  if (id === actingUserId) {
    throw new DomainError("SELF", "Vous ne pouvez pas supprimer votre propre compte ici.");
  }
  const user = await db.user.findUnique({ where: { id }, select: { email: true, isSuperAdmin: true } });
  if (!user) throw new DomainError("NOT_FOUND", "Utilisateur introuvable.");
  if (user.isSuperAdmin) {
    const count = await db.user.count({ where: { isSuperAdmin: true } });
    if (count <= 1) throw new DomainError("LAST_ADMIN", "Impossible : c'est le dernier super-admin.");
  }
  await db.user.delete({ where: { id } });
  return user.email;
}

/** Full, filterable audit log across all users. */
export async function listAuditLogs(filter: AuditFilter): Promise<AdminAuditResult> {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.text) {
    const t = filter.text.trim();
    if (t) {
      where.OR = [
        { detail: { contains: t, mode: "insensitive" } },
        { userEmail: { contains: t, mode: "insensitive" } },
        { action: { contains: t, mode: "insensitive" } },
      ];
    }
  }
  if (filter.from || filter.to) {
    const range: Prisma.DateTimeFilter = {};
    if (filter.from) range.gte = new Date(`${filter.from}T00:00:00`);
    if (filter.to) range.lte = new Date(`${filter.to}T23:59:59`);
    where.createdAt = range;
  }

  const take = filter.take ?? 100;
  const skip = filter.skip ?? 0;
  const [rows, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: { id: true, userId: true, userEmail: true, action: true, detail: true, createdAt: true },
    }),
    db.auditLog.count({ where }),
  ]);
  return { rows: rows as AdminAuditRow[], totalCount };
}

/** Distinct action names present in the log (for the filter dropdown). */
export async function listAuditActions(): Promise<string[]> {
  const rows = await db.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });
  return rows.map((r) => r.action);
}
