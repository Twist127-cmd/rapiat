import { subMonths, subYears } from "date-fns";

import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import { toCents } from "@/lib/money";
import { monthRange, yearRange, formatMonthLabel } from "@/lib/dates";
import type { BudgetPeriod } from "@/config/constants";
import {
  budgetState,
  consumedPercent,
  effectiveBudgetCents,
  remainingCents,
} from "@/modules/budgets/domain/budget.rules";
import type { BudgetInput } from "@/modules/budgets/schemas";
import type { BudgetRow, BudgetsSummary } from "@/modules/budgets/types";

type SpentMap = Map<string, number>;

async function spentByCategory(
  { db }: UserScope,
  categoryIds: string[],
  from: Date,
  to: Date,
): Promise<SpentMap> {
  const map: SpentMap = new Map();
  if (categoryIds.length === 0) return map;
  const rows = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { type: "EXPENSE", categoryId: { in: categoryIds }, date: { gte: from, lte: to } },
    _sum: { amountCents: true },
  });
  for (const row of rows) {
    if (row.categoryId) map.set(row.categoryId, row._sum.amountCents ?? 0);
  }
  return map;
}

/** List budgets with current-period spend, rollover, and progress state. */
export async function listBudgets(
  scope: UserScope,
  now: Date = new Date(),
): Promise<BudgetRow[]> {
  const budgets = await scope.db.budget.findMany({
    include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (budgets.length === 0) return [];

  const monthlyIds = budgets.filter((b) => b.periodType === "MONTHLY").map((b) => b.categoryId);
  const yearlyIds = budgets.filter((b) => b.periodType === "YEARLY").map((b) => b.categoryId);

  const month = monthRange(now);
  const prevMonth = monthRange(subMonths(now, 1));
  const year = yearRange(now);
  const prevYear = yearRange(subYears(now, 1));

  const [monthSpent, prevMonthSpent, yearSpent, prevYearSpent] = await Promise.all([
    spentByCategory(scope, monthlyIds, month.from, month.to),
    spentByCategory(scope, monthlyIds, prevMonth.from, prevMonth.to),
    spentByCategory(scope, yearlyIds, year.from, year.to),
    spentByCategory(scope, yearlyIds, prevYear.from, prevYear.to),
  ]);

  return budgets.map((b) => {
    const isMonthly = b.periodType === "MONTHLY";
    const spentCents = (isMonthly ? monthSpent : yearSpent).get(b.categoryId) ?? 0;
    const previousSpent = (isMonthly ? prevMonthSpent : prevYearSpent).get(b.categoryId) ?? 0;
    const effective = effectiveBudgetCents(b.amountCents, b.rollover, previousSpent);
    return {
      id: b.id,
      category: b.category,
      periodType: b.periodType as BudgetPeriod,
      amountCents: b.amountCents,
      effectiveBudgetCents: effective,
      rollover: b.rollover,
      spentCents,
      remainingCents: remainingCents(spentCents, effective),
      percent: consumedPercent(spentCents, effective),
      state: budgetState(spentCents, effective),
    };
  });
}

export async function getBudgetsSummary(
  scope: UserScope,
  now: Date = new Date(),
): Promise<BudgetsSummary> {
  const budgets = await listBudgets(scope, now);
  const totalBudgetCents = budgets.reduce((s, b) => s + b.effectiveBudgetCents, 0);
  const totalSpentCents = budgets.reduce((s, b) => s + b.spentCents, 0);
  return {
    totalBudgetCents,
    totalSpentCents,
    totalRemainingCents: totalBudgetCents - totalSpentCents,
    periodLabel: formatMonthLabel(now),
  };
}

export async function createBudget(scope: UserScope, input: BudgetInput): Promise<void> {
  const existing = await scope.db.budget.findFirst({
    where: { categoryId: input.categoryId, periodType: input.periodType },
    select: { id: true },
  });
  if (existing) {
    throw new DomainError("DUPLICATE", "Un budget existe déjà pour cette catégorie et période.");
  }
  await scope.db.budget.create({
    data: {
      userId: scope.userId,
      categoryId: input.categoryId,
      periodType: input.periodType,
      amountCents: toCents(input.amount),
      rollover: input.rollover ?? false,
    },
  });
}

export async function updateBudget(
  { db }: UserScope,
  id: string,
  input: BudgetInput,
): Promise<void> {
  const result = await db.budget.updateMany({
    where: { id },
    data: {
      categoryId: input.categoryId,
      periodType: input.periodType,
      amountCents: toCents(input.amount),
      rollover: input.rollover ?? false,
    },
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Budget introuvable.");
}

export async function deleteBudget({ db }: UserScope, id: string): Promise<void> {
  const result = await db.budget.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Budget introuvable.");
}
