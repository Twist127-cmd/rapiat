/** Savings module public surface. */
export { listSavingsGoals, getSavingsSummary } from "./services/savings.service";
export { SavingsView } from "./components/SavingsView";
export { SavingsGoalFormDialog } from "./components/SavingsGoalFormDialog";
export {
  progressPercent,
  savingsRate,
  monthlyContributionNeeded,
} from "./domain/savings.rules";
export {
  savingsGoalInputSchema,
  contributionSchema,
  type SavingsGoalInput,
} from "./schemas";
export type { SavingsGoalRow, SavingsSummary } from "./types";
