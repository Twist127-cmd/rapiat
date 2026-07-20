import type { BudgetPeriod } from "@/config/constants";
import type { BudgetState } from "./domain/budget.rules";

export interface BudgetRow {
  id: string;
  category: { id: string; name: string; color: string; icon: string };
  periodType: BudgetPeriod;
  amountCents: number;
  effectiveBudgetCents: number;
  rollover: boolean;
  spentCents: number;
  remainingCents: number;
  percent: number;
  state: BudgetState;
}

export interface BudgetsSummary {
  totalBudgetCents: number;
  totalSpentCents: number;
  totalRemainingCents: number;
  periodLabel: string;
}
