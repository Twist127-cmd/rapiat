import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import { SavingsView, listSavingsGoals, getSavingsSummary, savingsRate } from "@/modules/savings";
import { listAccountOptions } from "@/modules/accounts";
import { monthRange } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Épargne",
};

export default async function SavingsPage() {
  const ctx = await getUserContext();
  const { from, to } = monthRange(new Date());

  const [goals, summary, accounts, incomeAgg, expenseAgg] = await Promise.all([
    listSavingsGoals(ctx),
    getSavingsSummary(ctx),
    listAccountOptions(ctx),
    ctx.db.transaction.aggregate({
      where: { type: "INCOME", date: { gte: from, lte: to } },
      _sum: { amountCents: true },
    }),
    ctx.db.transaction.aggregate({
      where: { type: "EXPENSE", date: { gte: from, lte: to } },
      _sum: { amountCents: true },
    }),
  ]);

  const incomeCents = incomeAgg._sum.amountCents ?? 0;
  const expenseCents = expenseAgg._sum.amountCents ?? 0;
  const savedThisMonth = Math.max(0, incomeCents - expenseCents);

  return (
    <SavingsView
      goals={goals}
      summary={summary}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      currency={ctx.currency}
      savingsRatePercent={savingsRate(savedThisMonth, incomeCents)}
    />
  );
}
