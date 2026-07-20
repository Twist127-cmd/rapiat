export interface SavingsGoalRow {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  deadline: Date | null;
  color: string;
  accountId: string | null;
  accountName: string | null;
  percent: number;
  remainingCents: number;
  monthlyNeededCents: number | null;
}

export interface SavingsSummary {
  totalSavedCents: number;
  totalTargetCents: number;
  goalCount: number;
}
