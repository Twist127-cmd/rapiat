import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import { AccountsView, listAccounts, getConsolidatedBalance } from "@/modules/accounts";

export const metadata: Metadata = {
  title: "Comptes",
};

export default async function AccountsPage() {
  const ctx = await getUserContext();
  const [accounts, consolidated] = await Promise.all([
    listAccounts(ctx),
    getConsolidatedBalance(ctx),
  ]);
  return <AccountsView accounts={accounts} consolidated={consolidated} />;
}
