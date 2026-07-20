import { subMonths, startOfMonth, endOfMonth } from "date-fns";

import type { UserScope } from "@/server/user-db";
import { monthRange, formatMonthShort } from "@/lib/dates";
import { savingsRate } from "@/modules/savings/domain/savings.rules";
import type {
  BalancePoint,
  CategoryDatum,
  MonthlySummary,
  PeriodComparison,
  TrendDatum,
} from "@/modules/reports/types";

/** Income / fixed / variable / net / savings-rate for a given month. */
export async function getMonthlySummary(
  { db }: UserScope,
  monthDate: Date = new Date(),
): Promise<MonthlySummary> {
  const { from, to } = monthRange(monthDate);
  const dateWindow = { gte: from, lte: to };

  const [income, fixed, variable] = await Promise.all([
    db.transaction.aggregate({
      where: { type: "INCOME", date: dateWindow },
      _sum: { amountCents: true },
    }),
    db.transaction.aggregate({
      where: { type: "EXPENSE", expenseKind: "FIXED", date: dateWindow },
      _sum: { amountCents: true },
    }),
    db.transaction.aggregate({
      where: { type: "EXPENSE", expenseKind: "VARIABLE", date: dateWindow },
      _sum: { amountCents: true },
    }),
  ]);

  const incomeCents = income._sum.amountCents ?? 0;
  const fixedExpenseCents = fixed._sum.amountCents ?? 0;
  const variableExpenseCents = variable._sum.amountCents ?? 0;
  const totalExpenseCents = fixedExpenseCents + variableExpenseCents;
  const netCents = incomeCents - totalExpenseCents;

  return {
    incomeCents,
    fixedExpenseCents,
    variableExpenseCents,
    totalExpenseCents,
    netCents,
    savingsRatePercent: savingsRate(Math.max(0, netCents), incomeCents),
  };
}

/** Expense (or income) breakdown by category for a month, largest first. */
export async function getCategoryBreakdown(
  { db }: UserScope,
  monthDate: Date = new Date(),
  type: "EXPENSE" | "INCOME" = "EXPENSE",
): Promise<CategoryDatum[]> {
  const { from, to } = monthRange(monthDate);
  const grouped = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { type, date: { gte: from, lte: to } },
    _sum: { amountCents: true },
  });

  const categoryIds = grouped.map((g) => g.categoryId).filter((id): id is string => Boolean(id));
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((g) => {
      const cat = g.categoryId ? byId.get(g.categoryId) : undefined;
      return {
        name: cat?.name ?? "Sans catégorie",
        color: cat?.color ?? "#6b7280",
        amountCents: g._sum.amountCents ?? 0,
      };
    })
    .filter((d) => d.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents);
}

/**
 * Fetch monthly income/expense totals for the last `months` months (single
 * query, bucketed in JS) plus the running net-worth balance at each month end.
 */
export async function getTrendAndBalance(
  scope: UserScope,
  months = 6,
): Promise<{ trend: TrendDatum[]; balance: BalancePoint[] }> {
  const { db } = scope;
  const now = new Date();
  const windowStart = startOfMonth(subMonths(now, months - 1));

  const [rows, before, accounts] = await Promise.all([
    db.transaction.findMany({
      where: { date: { gte: windowStart }, type: { in: ["INCOME", "EXPENSE"] } },
      select: { date: true, type: true, amountCents: true },
    }),
    db.transaction.aggregate({
      where: { date: { lt: windowStart }, type: "INCOME" },
      _sum: { amountCents: true },
    }),
    db.account.aggregate({ _sum: { initialBalanceCents: true } }),
  ]);

  // Net flows strictly before the window (income positive, expense negative).
  const expenseBefore = await db.transaction.aggregate({
    where: { date: { lt: windowStart }, type: "EXPENSE" },
    _sum: { amountCents: true },
  });
  const baseline =
    (accounts._sum.initialBalanceCents ?? 0) +
    (before._sum.amountCents ?? 0) -
    (expenseBefore._sum.amountCents ?? 0);

  const buckets: TrendDatum[] = [];
  const bucketIndex = new Map<string, number>();
  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = subMonths(now, i);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    bucketIndex.set(key, buckets.length);
    buckets.push({ label: formatMonthShort(monthDate), incomeCents: 0, expenseCents: 0 });
  }

  for (const row of rows) {
    const key = `${row.date.getFullYear()}-${row.date.getMonth()}`;
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    if (row.type === "INCOME") buckets[idx]!.incomeCents += row.amountCents;
    else buckets[idx]!.expenseCents += row.amountCents;
  }

  let running = baseline;
  const balance: BalancePoint[] = buckets.map((b) => {
    running += b.incomeCents - b.expenseCents;
    return { label: b.label, balanceCents: running };
  });

  return { trend: buckets, balance };
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Compare a month against the previous one. */
export async function comparePeriods(
  scope: UserScope,
  monthDate: Date = new Date(),
): Promise<PeriodComparison> {
  const [current, previous] = await Promise.all([
    getMonthlySummary(scope, monthDate),
    getMonthlySummary(scope, subMonths(monthDate, 1)),
  ]);
  return {
    current,
    previous,
    incomeDeltaPercent: deltaPercent(current.incomeCents, previous.incomeCents),
    expenseDeltaPercent: deltaPercent(current.totalExpenseCents, previous.totalExpenseCents),
  };
}

/** Everything needed to render a monthly PDF/Excel export. */
export async function getExportBundle(scope: UserScope, monthDate: Date = new Date()) {
  const { from, to } = monthRange(monthDate);
  const [summary, categories, transactions] = await Promise.all([
    getMonthlySummary(scope, monthDate),
    getCategoryBreakdown(scope, monthDate),
    scope.db.transaction.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: [{ date: "asc" }],
      include: {
        account: { select: { name: true } },
        category: { select: { name: true } },
        transferAccount: { select: { name: true } },
      },
    }),
  ]);
  return { summary, categories, transactions, from, to };
}

/** Range helper re-exported for the reports page date pickers. */
export { startOfMonth, endOfMonth };
