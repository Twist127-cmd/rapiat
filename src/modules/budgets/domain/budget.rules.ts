/** Pure domain helpers for budgets. No framework/DB dependencies. */

export type BudgetState = "ok" | "warning" | "reached" | "exceeded";

/** Warning threshold: highlight budgets nearing their limit. */
export const WARNING_THRESHOLD = 0.8;

/**
 * Effective budget for a period, accounting for rollover: when enabled, the
 * unspent remainder of the previous period is carried over (never negative).
 */
export function effectiveBudgetCents(
  amountCents: number,
  rollover: boolean,
  previousSpentCents: number,
): number {
  if (!rollover) return amountCents;
  const carry = Math.max(0, amountCents - previousSpentCents);
  return amountCents + carry;
}

/** Percentage of the budget consumed (0..∞), rounded to an integer. */
export function consumedPercent(spentCents: number, budgetCents: number): number {
  if (budgetCents <= 0) return spentCents > 0 ? 100 : 0;
  return Math.round((spentCents / budgetCents) * 100);
}

/** Traffic-light state of a budget given spend vs. its (effective) amount. */
export function budgetState(spentCents: number, budgetCents: number): BudgetState {
  if (budgetCents <= 0) return spentCents > 0 ? "exceeded" : "ok";
  if (spentCents > budgetCents) return "exceeded";
  if (spentCents === budgetCents) return "reached";
  if (spentCents >= budgetCents * WARNING_THRESHOLD) return "warning";
  return "ok";
}

/** Remaining amount (can be negative when overspent). */
export function remainingCents(spentCents: number, budgetCents: number): number {
  return budgetCents - spentCents;
}
