import type { ExpenseKind, Frequency, TransactionType } from "@/config/constants";

export interface RecurringRuleRow {
  id: string;
  label: string;
  type: TransactionType;
  amountCents: number;
  frequency: Frequency;
  interval: number;
  nextRunDate: Date;
  endDate: Date | null;
  note: string | null;
  expenseKind: ExpenseKind | null;
  active: boolean;
  monthlyEquivalentCents: number;
  account: { id: string; name: string };
  category: { id: string; name: string; color: string; icon: string } | null;
}

export interface RecurringSummary {
  monthlyFixedExpenseCents: number;
  monthlyIncomeCents: number;
  /** Income − fixed commitments = what's left to live on each month. */
  restToLiveCents: number;
  activeCount: number;
}
