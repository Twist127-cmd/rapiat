import { describe, it, expect } from "vitest";

import {
  monthlyEquivalentCents,
  computeDueDates,
} from "@/modules/recurring/domain/recurring.rules";

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
    const start = new Date("2026-01-15T00:00:00Z");
    const until = new Date("2026-04-01T00:00:00Z");
    const { dueDates, nextRunDate } = computeDueDates(start, "MONTHLY", 1, null, until);
    expect(dueDates.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
    ]);
    expect(nextRunDate.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  it("stops at endDate", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const until = new Date("2026-12-01T00:00:00Z");
    const end = new Date("2026-03-01T00:00:00Z");
    const { dueDates } = computeDueDates(start, "MONTHLY", 1, end, until);
    expect(dueDates).toHaveLength(2); // Jan 15, Feb 15 (Mar 15 is after endDate)
  });

  it("returns nothing when nextRunDate is in the future", () => {
    const start = new Date("2026-06-15T00:00:00Z");
    const until = new Date("2026-01-01T00:00:00Z");
    const { dueDates } = computeDueDates(start, "MONTHLY", 1, null, until);
    expect(dueDates).toHaveLength(0);
  });
});
