import type { Prisma } from "@/generated/prisma/client";
import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import { toCents } from "@/lib/money";
import { tzDayStart } from "@/lib/dates";
import type { ExpenseKind, TransactionType } from "@/config/constants";
import { isTransferValid } from "@/modules/transactions/domain/transaction.rules";
import type { TransactionInput } from "@/modules/transactions/schemas";
import type {
  TransactionFilters,
  TransactionListResult,
  TransactionRow,
} from "@/modules/transactions/types";

const ROW_INCLUDE = {
  account: { select: { id: true, name: true, color: true, icon: true } },
  category: { select: { id: true, name: true, color: true, icon: true } },
  transferAccount: { select: { id: true, name: true } },
} satisfies Prisma.TransactionInclude;

type RawRow = Prisma.TransactionGetPayload<{ include: typeof ROW_INCLUDE }>;

function toRow(row: RawRow): TransactionRow {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amountCents: row.amountCents,
    date: row.date,
    note: row.note,
    tags: row.tags,
    expenseKind: (row.expenseKind as ExpenseKind | null) ?? null,
    recurringRuleId: row.recurringRuleId,
    account: row.account,
    category: row.category,
    transferAccount: row.transferAccount,
  };
}

function buildWhere(filters: TransactionFilters, timezone: string): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};

  if (filters.from || filters.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.from) {
      const start = tzDayStart(filters.from, timezone);
      if (start) dateFilter.gte = start;
    }
    if (filters.to) {
      const start = tzDayStart(filters.to, timezone);
      if (start) dateFilter.lt = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    }
    where.date = dateFilter;
  }
  if (filters.accountId) {
    where.OR = [
      { accountId: filters.accountId },
      { transferAccountId: filters.accountId },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.type) where.type = filters.type;
  if (filters.expenseKind) where.expenseKind = filters.expenseKind;
  if (filters.tag) where.tags = { has: filters.tag };
  if (filters.text) {
    const text = filters.text.trim();
    if (text) where.note = { contains: text, mode: "insensitive" };
  }
  return where;
}

/** List transactions matching filters, newest first, with period totals. */
export async function listTransactions(
  { db }: UserScope,
  filters: TransactionFilters,
  timezone: string,
): Promise<TransactionListResult> {
  const where = buildWhere(filters, timezone);
  const take = filters.take ?? 100;
  const skip = filters.skip ?? 0;

  const [rows, totalCount, incomeAgg, expenseAgg] = await Promise.all([
    db.transaction.findMany({
      where,
      include: ROW_INCLUDE,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    }),
    db.transaction.count({ where }),
    db.transaction.aggregate({ where: { ...where, type: "INCOME" }, _sum: { amountCents: true } }),
    db.transaction.aggregate({ where: { ...where, type: "EXPENSE" }, _sum: { amountCents: true } }),
  ]);

  return {
    rows: rows.map(toRow),
    totalCount,
    totalIncomeCents: incomeAgg._sum.amountCents ?? 0,
    totalExpenseCents: expenseAgg._sum.amountCents ?? 0,
  };
}

/** Recent transactions (dashboard). */
export async function listRecentTransactions(
  { db }: UserScope,
  limit = 6,
): Promise<TransactionRow[]> {
  const rows = await db.transaction.findMany({
    include: ROW_INCLUDE,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toRow);
}

/** Normalize an input into Prisma data, enforcing transfer/expense invariants. */
function toData(scope: UserScope, input: TransactionInput) {
  const date = tzDayStart(input.date, scope.timezone);
  if (!date) throw new DomainError("INVALID", "Date invalide.");

  const isTransfer = input.type === "TRANSFER";
  if (isTransfer && !isTransferValid(input.accountId, input.transferAccountId)) {
    throw new DomainError("INVALID", "Transfert invalide : choisissez deux comptes différents.");
  }

  return {
    accountId: input.accountId,
    type: input.type,
    amountCents: toCents(input.amount),
    date,
    note: input.note?.trim() || null,
    tags: input.tags ?? [],
    // Category & expenseKind are meaningless on transfers.
    categoryId: isTransfer ? null : input.categoryId || null,
    expenseKind: input.type === "EXPENSE" ? (input.expenseKind ?? "VARIABLE") : null,
    transferAccountId: isTransfer ? (input.transferAccountId as string) : null,
  };
}

export async function createTransaction(
  scope: UserScope,
  input: TransactionInput,
): Promise<void> {
  await scope.db.transaction.create({
    data: { userId: scope.userId, ...toData(scope, input) },
  });
}

export async function updateTransaction(
  scope: UserScope,
  id: string,
  input: TransactionInput,
): Promise<void> {
  const result = await scope.db.transaction.updateMany({
    where: { id },
    data: toData(scope, input),
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Transaction introuvable.");
}

export async function deleteTransaction({ db }: UserScope, id: string): Promise<void> {
  const result = await db.transaction.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Transaction introuvable.");
}

/** Duplicate a transaction (same values, today's date is kept from the source). */
export async function duplicateTransaction(scope: UserScope, id: string): Promise<void> {
  const source = await scope.db.transaction.findUnique({ where: { id } });
  if (!source) throw new DomainError("NOT_FOUND", "Transaction introuvable.");
  await scope.db.transaction.create({
    data: {
      userId: scope.userId,
      accountId: source.accountId,
      type: source.type,
      amountCents: source.amountCents,
      date: source.date,
      note: source.note,
      tags: source.tags,
      categoryId: source.categoryId,
      expenseKind: source.expenseKind,
      transferAccountId: source.transferAccountId,
    },
  });
}

/** Bulk delete a set of transactions (mass edit). */
export async function bulkDeleteTransactions({ db }: UserScope, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await db.transaction.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}
