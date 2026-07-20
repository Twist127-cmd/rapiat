import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import { listTransactions, TransactionsView } from "@/modules/transactions";
import { listAccountOptions } from "@/modules/accounts";
import { listCategoryOptions } from "@/modules/categories";
import type { TransactionFilters } from "@/modules/transactions";
import type { ExpenseKind, TransactionType } from "@/config/constants";

export const metadata: Metadata = {
  title: "Transactions",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const ctx = await getUserContext();

  const filters: TransactionFilters = {
    from: str(sp.from),
    to: str(sp.to),
    accountId: str(sp.accountId),
    categoryId: str(sp.categoryId),
    type: str(sp.type) as TransactionType | undefined,
    expenseKind: str(sp.expenseKind) as ExpenseKind | undefined,
    text: str(sp.text),
    tag: str(sp.tag),
  };

  const [data, accounts, categories] = await Promise.all([
    listTransactions(ctx, filters, ctx.timezone),
    listAccountOptions(ctx),
    listCategoryOptions(ctx),
  ]);

  return (
    <TransactionsView
      data={data}
      accounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color,
        icon: a.icon,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
      currency={ctx.currency}
      filters={{
        from: filters.from,
        to: filters.to,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        type: filters.type,
        expenseKind: filters.expenseKind,
        text: filters.text,
      }}
    />
  );
}
