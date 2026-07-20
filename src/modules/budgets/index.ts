/** Budgets module public surface. */
export { listBudgets, getBudgetsSummary } from "./services/budget.service";
export { BudgetsView } from "./components/BudgetsView";
export { BudgetFormDialog } from "./components/BudgetFormDialog";
export {
  budgetState,
  consumedPercent,
  effectiveBudgetCents,
} from "./domain/budget.rules";
export { budgetInputSchema, type BudgetInput } from "./schemas";
export type { BudgetRow, BudgetsSummary } from "./types";
