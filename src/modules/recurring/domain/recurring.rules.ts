/** Pure domain helpers for recurring rules. No framework/DB dependencies. */
import { addFrequency } from "@/lib/dates";

export type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

/**
 * Normalize a recurring amount to its monthly-equivalent cents, so fixed
 * commitments of different frequencies can be summed into a monthly charge.
 * CUSTOM treats `interval` as a number of days.
 */
export function monthlyEquivalentCents(
  amountCents: number,
  frequency: Frequency,
  interval: number,
): number {
  const n = Math.max(1, interval);
  switch (frequency) {
    case "WEEKLY":
      return Math.round((amountCents * 52) / (12 * n));
    case "MONTHLY":
      return Math.round(amountCents / n);
    case "YEARLY":
      return Math.round(amountCents / (12 * n));
    case "CUSTOM":
      return Math.round((amountCents * 30) / n);
    default:
      return amountCents;
  }
}

export interface DueGeneration {
  /** All occurrence dates due at or before `until`. */
  dueDates: Date[];
  /** The rule's next run date after consuming the due occurrences. */
  nextRunDate: Date;
}

/**
 * Compute the occurrences of a rule due at or before `until`, starting from
 * `nextRunDate`, stopping at `endDate` (inclusive) when set. Also returns the
 * new `nextRunDate` to persist. Capped to avoid pathological loops.
 */
export function computeDueDates(
  nextRunDate: Date,
  frequency: Frequency,
  interval: number,
  endDate: Date | null,
  until: Date,
): DueGeneration {
  const dueDates: Date[] = [];
  let cursor = nextRunDate;
  let guard = 0;

  while (cursor.getTime() <= until.getTime() && guard < 2000) {
    if (endDate && cursor.getTime() > endDate.getTime()) break;
    dueDates.push(cursor);
    cursor = addFrequency(cursor, frequency, interval);
    guard += 1;
  }

  return { dueDates, nextRunDate: cursor };
}
