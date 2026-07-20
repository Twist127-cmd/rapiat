import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import {
  RecurringView,
  listRecurring,
  getRecurringSummary,
  generateDueTransactions,
} from "@/modules/recurring";
import { listAccountOptions } from "@/modules/accounts";
import { listCategoryOptions } from "@/modules/categories";

export const metadata: Metadata = {
  title: "Dépenses fixes",
};

export default async function RecurringPage() {
  const ctx = await getUserContext();
  // Lazily materialize any due recurring transactions on visit.
  await generateDueTransactions(ctx);

  const [rules, summary, accounts, categories] = await Promise.all([
    listRecurring(ctx),
    getRecurringSummary(ctx),
    listAccountOptions(ctx),
    listCategoryOptions(ctx),
  ]);

  return (
    <RecurringView
      rules={rules}
      summary={summary}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
      currency={ctx.currency}
    />
  );
}
