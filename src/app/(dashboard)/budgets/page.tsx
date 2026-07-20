import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import { BudgetsView, listBudgets, getBudgetsSummary } from "@/modules/budgets";
import { listCategoryOptions } from "@/modules/categories";

export const metadata: Metadata = {
  title: "Budgets",
};

export default async function BudgetsPage() {
  const ctx = await getUserContext();
  const [budgets, summary, categories] = await Promise.all([
    listBudgets(ctx),
    getBudgetsSummary(ctx),
    listCategoryOptions(ctx),
  ]);
  return (
    <BudgetsView
      budgets={budgets}
      summary={summary}
      categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
      currency={ctx.currency}
    />
  );
}
