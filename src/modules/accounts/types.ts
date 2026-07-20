import type { AccountType } from "@/config/constants";

export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string;
  icon: string;
  archived: boolean;
  initialBalanceCents: number;
  /** Derived current balance (opening balance + movements). */
  currentBalanceCents: number;
  transactionCount: number;
  createdAt: Date;
}

export interface ConsolidatedBalance {
  totalCents: number;
  currency: string;
  accountCount: number;
}
