/** Accounts module public surface. */
export {
  listAccounts,
  getConsolidatedBalance,
  listAccountOptions,
} from "./services/account.service";
export { AccountsView } from "./components/AccountsView";
export { AccountFormDialog } from "./components/AccountFormDialog";
export { computeBalance } from "./domain/account.rules";
export { accountInputSchema, type AccountInput } from "./schemas";
export type { AccountSummary, ConsolidatedBalance } from "./types";
