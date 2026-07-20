/** Pure domain helpers for savings goals. No framework/DB dependencies. */

/** Progress toward a goal as a rounded percentage (not capped). */
export function progressPercent(currentCents: number, targetCents: number): number {
  if (targetCents <= 0) return currentCents > 0 ? 100 : 0;
  return Math.round((currentCents / targetCents) * 100);
}

/** Amount still needed to reach the goal (never negative). */
export function remainingToTarget(currentCents: number, targetCents: number): number {
  return Math.max(0, targetCents - currentCents);
}

/**
 * Savings rate = money saved / income, as a rounded percentage. Returns 0 when
 * there is no income (avoids division by zero and misleading negatives).
 */
export function savingsRate(savedCents: number, incomeCents: number): number {
  if (incomeCents <= 0) return 0;
  return Math.round((savedCents / incomeCents) * 100);
}

/**
 * Suggested monthly contribution to reach a goal by its deadline, given the
 * whole number of months remaining. Rounds up so the goal is met in time.
 */
export function monthlyContributionNeeded(
  remainingCents: number,
  monthsLeft: number,
): number {
  if (remainingCents <= 0) return 0;
  const months = Math.max(1, monthsLeft);
  return Math.ceil(remainingCents / months);
}
