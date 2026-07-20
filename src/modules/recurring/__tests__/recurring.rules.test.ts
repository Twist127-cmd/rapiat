import { describe, it, expect } from "vitest";
import { format } from "date-fns";

import {
  monthlyEquivalentCents,
  computeDueDates,
} from "@/modules/recurring/domain/recurring.rules";

// Build dates in LOCAL time and assert with date-fns `format` so the test is
// timezone/DST-independent (addFrequency advances in wall-clock time, matching
// how the UTC production runtime behaves).
const local = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const ymd = (date: Date) => format(date, "yyyy-MM-dd");

describe("monthlyEquivalentCents", () => {
  it("keeps monthly amounts (interval 1)", () => {
    expect(monthlyEquivalentCents(120_000, "MONTHLY", 1)).toBe(120_000);
  });
  it("spreads a yearly amount over 12 months", () => {
    expect(monthlyEquivalentCents(120_000, "YEARLY", 1)).toBe(10_000);
  });
  it("scales weekly by 52/12", () => {
    expect(monthlyEquivalentCents(1_200, "WEEKLY", 1)).toBe(Math.round((1_200 * 52) / 12));
  });
  it("halves for interval 2 (every 2 months)", () => {
    expect(monthlyEquivalentCents(120_000, "MONTHLY", 2)).toBe(60_000);
  });
});

describe("computeDueDates", () => {
  it("generates monthly occurrences up to `until` and advances nextRunDate", () => {
    const { dueDates, nextRunDate } = computeDueDates(
      local(2026, 1, 15),
      "MONTHLY",
      1,
      null,
      local(2026, 4, 1),
    );
    expect(dueDates.map(ymd)).toEqual(["2026-01-15", "2026-02-15", "2026-03-15"]);
    expect(ymd(nextRunDate)).toBe("2026-04-15");
  });

  it("stops at endDate", () => {
    const { dueDates } = computeDueDates(
      local(2026, 1, 15),
      "MONTHLY",
      1,
      local(2026, 3, 1),
      local(2026, 12, 1),
    );
    expect(dueDates).toHaveLength(2); // Jan 15, Feb 15 (Mar 15 is after endDate)
  });

  it("returns nothing when nextRunDate is in the future", () => {
    const { dueDates } = computeDueDates(
      local(2026, 6, 15),
      "MONTHLY",
      1,
      null,
      local(2026, 1, 1),
    );
    expect(dueDates).toHaveLength(0);
  });
});
