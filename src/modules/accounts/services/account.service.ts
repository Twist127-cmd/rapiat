import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import type { AccountType } from "@/config/constants";
import { toCents } from "@/lib/money";
import {
  computeBalance,
  EMPTY_FLOWS,
  type AccountFlows,
} from "@/modules/accounts/domain/account.rules";
import type { AccountInput } from "@/modules/accounts/schemas";
import type { AccountSummary, ConsolidatedBalance } from "@/modules/accounts/types";

/**
 * Build a map of accountId -> aggregated movement flows, in as few queries as
 * possible. Used to derive current balances without ever storing them.
 */
async function loadFlows({ db }: UserScope): Promise<Map<string, AccountFlows>> {
  const [byType, transfersIn] = await Promise.all([
    db.transaction.groupBy({
      by: ["accountId", "type"],
      _sum: { amountCents: true },
    }),
    db.transaction.groupBy({
      by: ["transferAccountId"],
      where: { type: "TRANSFER", transferAccountId: { not: null } },
      _sum: { amountCents: true },
    }),
  ]);

  const flows = new Map<string, AccountFlows>();
  const ensure = (id: string): AccountFlows => {
    let f = flows.get(id);
    if (!f) {
      f = { ...EMPTY_FLOWS };
      flows.set(id, f);
    }
    return f;
  };

  for (const row of byType) {
    const sum = row._sum.amountCents ?? 0;
    const f = ensure(row.accountId);
    if (row.type === "INCOME") f.incomeCents += sum;
    else if (row.type === "EXPENSE") f.expenseCents += sum;
    else if (row.type === "TRANSFER") f.transferOutCents += sum;
  }
  for (const row of transfersIn) {
    if (!row.transferAccountId) continue;
    ensure(row.transferAccountId).transferInCents += row._sum.amountCents ?? 0;
  }
  return flows;
}

/** List accounts with their derived current balances. */
export async function listAccounts(scope: UserScope): Promise<AccountSummary[]> {
  const [rows, flows] = await Promise.all([
    scope.db.account.findMany({
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { transactions: true } } },
    }),
    loadFlows(scope),
  ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    currency: row.currency,
    color: row.color,
    icon: row.icon,
    archived: row.archived,
    initialBalanceCents: row.initialBalanceCents,
    currentBalanceCents: computeBalance(
      row.initialBalanceCents,
      flows.get(row.id) ?? EMPTY_FLOWS,
    ),
    transactionCount: row._count.transactions,
    createdAt: row.createdAt,
  }));
}

/** Consolidated balance across all non-archived accounts in the user currency. */
export async function getConsolidatedBalance(scope: UserScope): Promise<ConsolidatedBalance> {
  const accounts = await listAccounts(scope);
  const active = accounts.filter((a) => !a.archived);
  return {
    totalCents: active.reduce((sum, a) => sum + a.currentBalanceCents, 0),
    currency: scope.currency,
    accountCount: active.length,
  };
}

/** Lightweight list for pickers (id + name + currency). */
export async function listAccountOptions({ db }: UserScope) {
  return db.account.findMany({
    where: { archived: false },
    select: { id: true, name: true, currency: true, color: true, icon: true, type: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createAccount(scope: UserScope, input: AccountInput): Promise<void> {
  await scope.db.account.create({
    data: {
      userId: scope.userId,
      name: input.name,
      type: input.type,
      initialBalanceCents: toCents(input.initialBalance),
      currency: input.currency,
      color: input.color,
      icon: input.icon,
    },
  });
}

export async function updateAccount(
  { db }: UserScope,
  id: string,
  input: AccountInput,
): Promise<void> {
  const result = await db.account.updateMany({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      initialBalanceCents: toCents(input.initialBalance),
      currency: input.currency,
      color: input.color,
      icon: input.icon,
      archived: input.archived ?? false,
    },
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Compte introuvable.");
}

export async function setArchived(
  { db }: UserScope,
  id: string,
  archived: boolean,
): Promise<void> {
  const result = await db.account.updateMany({ where: { id }, data: { archived } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Compte introuvable.");
}

/**
 * Delete an account. Refused while it still holds transactions, to protect
 * accounting history — archive it instead.
 */
export async function deleteAccount({ db }: UserScope, id: string): Promise<void> {
  const count = await db.transaction.count({ where: { accountId: id } });
  if (count > 0) {
    throw new DomainError(
      "IN_USE",
      "Ce compte a des transactions : archivez-le plutôt que de le supprimer.",
    );
  }
  const result = await db.account.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Compte introuvable.");
}
