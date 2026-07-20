import type { ExpenseKind, TransactionType } from "@/config/constants";

export interface TransactionRow {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: Date;
  note: string | null;
  tags: string[];
  expenseKind: ExpenseKind | null;
  recurringRuleId: string | null;
  account: { id: string; name: string; color: string; icon: string };
  category: { id: string; name: string; color: string; icon: string } | null;
  transferAccount: { id: string; name: string } | null;
}

export interface TransactionListResult {
  rows: TransactionRow[];
  totalCount: number;
  totalIncomeCents: number;
  totalExpenseCents: number;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  expenseKind?: ExpenseKind;
  text?: string;
  tag?: string;
  take?: number;
  skip?: number;
}
