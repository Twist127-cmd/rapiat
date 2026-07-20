/**
 * Date & timezone helpers built on date-fns with the French locale.
 *
 * Dates are stored as true UTC instants. The UI shows "wall-clock" dates in the
 * user's timezone (default Europe/Zurich). These helpers centralize conversion
 * and formatting so components never hardcode locale, format strings, or tz.
 */
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears,
  addDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";

/** Parse a "YYYY-MM-DD" day (in `timeZone`) into that day's UTC midnight instant. */
export function tzDayStart(dateISO: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) return null;
  return new Date(
    TZDate.tz(timeZone, Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0).getTime(),
  );
}

/** Format a UTC instant as a "YYYY-MM-DD" value for <input type="date"> in `timeZone`. */
export function instantToDateInput(date: Date, timeZone: string): string {
  return format(new TZDate(date.getTime(), timeZone), "yyyy-MM-dd");
}

/** e.g. "mercredi 9 juillet 2025". */
export function formatLongDate(date: Date): string {
  return format(date, "EEEE d MMMM yyyy", { locale: fr });
}

/** e.g. "09/07/2025". */
export function formatShortDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: fr });
}

/** e.g. "09/07/2025", formatted in `timeZone` (use server-side where runtime is UTC). */
export function formatShortDateInTz(date: Date, timeZone: string): string {
  return format(new TZDate(date.getTime(), timeZone), "dd/MM/yyyy", { locale: fr });
}

/** e.g. "juillet 2025". */
export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy", { locale: fr });
}

/** e.g. "juil." — short month, for chart axes. */
export function formatMonthShort(date: Date): string {
  return format(date, "MMM", { locale: fr });
}

/** Inclusive day/month/year boundaries used by aggregations. */
export const dayRange = (date: Date) => ({ from: startOfDay(date), to: endOfDay(date) });
export const monthRange = (date: Date) => ({ from: startOfMonth(date), to: endOfMonth(date) });
export const yearRange = (date: Date) => ({ from: startOfYear(date), to: endOfYear(date) });

/** Add one period step to a date, used to advance recurring rules. */
export function addFrequency(
  date: Date,
  frequency: "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM",
  interval: number,
): Date {
  const step = Math.max(1, interval);
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(date, step);
    case "MONTHLY":
      return addMonths(date, step);
    case "YEARLY":
      return addYears(date, step);
    case "CUSTOM":
      // CUSTOM interprets `interval` as a number of days.
      return addDays(date, step);
    default:
      return addMonths(date, step);
  }
}
