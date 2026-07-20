import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import { toCents } from "@/lib/money";
import { tzDayStart } from "@/lib/dates";
import type { ExpenseKind, Frequency, TransactionType } from "@/config/constants";
import {
  computeDueDates,
  monthlyEquivalentCents,
} from "@/modules/recurring/domain/recurring.rules";
import type { RecurringInput } from "@/modules/recurring/schemas";
import type { RecurringRuleRow, RecurringSummary } from "@/modules/recurring/types";

/** List recurring rules with their monthly-equivalent amounts. */
export async function listRecurring({ db }: UserScope): Promise<RecurringRuleRow[]> {
  const rows = await db.recurringRule.findMany({
    orderBy: [{ active: "desc" }, { nextRunDate: "asc" }],
    include: {
      account: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true, icon: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    type: row.type as TransactionType,
    amountCents: row.amountCents,
    frequency: row.frequency as Frequency,
    interval: row.interval,
    nextRunDate: row.nextRunDate,
    endDate: row.endDate,
    note: row.note,
    expenseKind: (row.expenseKind as ExpenseKind | null) ?? null,
    active: row.active,
    monthlyEquivalentCents: monthlyEquivalentCents(
      row.amountCents,
      row.frequency as Frequency,
      row.interval,
    ),
    account: row.account,
    category: row.category,
  }));
}

/** Monthly fixed charges, monthly income, and the resulting "reste à vivre". */
export async function getRecurringSummary(scope: UserScope): Promise<RecurringSummary> {
  const rules = await listRecurring(scope);
  const active = rules.filter((r) => r.active);
  const monthlyFixedExpenseCents = active
    .filter((r) => r.type === "EXPENSE")
    .reduce((sum, r) => sum + r.monthlyEquivalentCents, 0);
  const monthlyIncomeCents = active
    .filter((r) => r.type === "INCOME")
    .reduce((sum, r) => sum + r.monthlyEquivalentCents, 0);
  return {
    monthlyFixedExpenseCents,
    monthlyIncomeCents,
    restToLiveCents: monthlyIncomeCents - monthlyFixedExpenseCents,
    activeCount: active.length,
  };
}

function toData(scope: UserScope, input: RecurringInput) {
  const nextRunDate = tzDayStart(input.startDate, scope.timezone);
  if (!nextRunDate) throw new DomainError("INVALID", "Date de début invalide.");
  const endDate = input.endDate ? tzDayStart(input.endDate, scope.timezone) : null;
  return {
    accountId: input.accountId,
    categoryId: input.categoryId || null,
    type: input.type,
    amountCents: toCents(input.amount),
    frequency: input.frequency,
    interval: input.interval,
    nextRunDate,
    endDate,
    label: input.label,
    note: input.note?.trim() || null,
    expenseKind: input.type === "EXPENSE" ? (input.expenseKind ?? "FIXED") : null,
    active: input.active ?? true,
  };
}

export async function createRecurring(scope: UserScope, input: RecurringInput): Promise<void> {
  await scope.db.recurringRule.create({ data: { userId: scope.userId, ...toData(scope, input) } });
}

export async function updateRecurring(
  scope: UserScope,
  id: string,
  input: RecurringInput,
): Promise<void> {
  const result = await scope.db.recurringRule.updateMany({
    where: { id },
    data: toData(scope, input),
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Modèle introuvable.");
}

export async function setRecurringActive(
  { db }: UserScope,
  id: string,
  active: boolean,
): Promise<void> {
  const result = await db.recurringRule.updateMany({ where: { id }, data: { active } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Modèle introuvable.");
}

export async function deleteRecurring({ db }: UserScope, id: string): Promise<void> {
  const result = await db.recurringRule.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Modèle introuvable.");
}

/**
 * Lazily materialize transactions for every active rule whose next run is due.
 * Idempotent: a transaction is created once per (rule, date) thanks to the
 * `recurringRuleId` de-dupe check. Called when the user opens the app.
 */
export async function generateDueTransactions(scope: UserScope): Promise<number> {
  const { db, userId } = scope;
  const now = new Date();

  const rules = await db.recurringRule.findMany({
    where: { active: true, nextRunDate: { lte: now } },
  });

  let generated = 0;
  for (const rule of rules) {
    const { dueDates, nextRunDate } = computeDueDates(
      rule.nextRunDate,
      rule.frequency as Frequency,
      rule.interval,
      rule.endDate,
      now,
    );

    for (const date of dueDates) {
      const exists = await db.transaction.findFirst({
        where: { recurringRuleId: rule.id, date },
        select: { id: true },
      });
      if (exists) continue;
      await db.transaction.create({
        data: {
          userId,
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          type: rule.type,
          amountCents: rule.amountCents,
          date,
          note: rule.label,
          expenseKind: rule.expenseKind,
          recurringRuleId: rule.id,
        },
      });
      generated += 1;
    }

    const stillActive = rule.endDate ? nextRunDate.getTime() <= rule.endDate.getTime() : true;
    await db.recurringRule.update({
      where: { id: rule.id },
      data: { nextRunDate, active: stillActive },
    });
  }
  return generated;
}
