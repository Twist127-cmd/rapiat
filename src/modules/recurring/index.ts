/** Recurring (fixed expenses) module public surface. */
export {
  listRecurring,
  getRecurringSummary,
  generateDueTransactions,
} from "./services/recurring.service";
export { RecurringView } from "./components/RecurringView";
export { RecurringFormDialog } from "./components/RecurringFormDialog";
export { generateDueTransactionsAction } from "./actions/recurring.actions";
export {
  monthlyEquivalentCents,
  computeDueDates,
} from "./domain/recurring.rules";
export { recurringInputSchema, type RecurringInput } from "./schemas";
export type { RecurringRuleRow, RecurringSummary } from "./types";
