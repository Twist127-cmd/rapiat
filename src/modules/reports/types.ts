export interface MonthlySummary {
  incomeCents: number;
  fixedExpenseCents: number;
  variableExpenseCents: number;
  totalExpenseCents: number;
  netCents: number;
  savingsRatePercent: number;
}

export interface CategoryDatum {
  name: string;
  amountCents: number;
  color: string;
}

export interface TrendDatum {
  label: string;
  incomeCents: number;
  expenseCents: number;
}

export interface BalancePoint {
  label: string;
  balanceCents: number;
}

export interface PeriodComparison {
  current: MonthlySummary;
  previous: MonthlySummary;
  incomeDeltaPercent: number | null;
  expenseDeltaPercent: number | null;
}
