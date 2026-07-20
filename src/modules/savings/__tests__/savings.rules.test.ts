import { describe, it, expect } from "vitest";

import {
  progressPercent,
  remainingToTarget,
  savingsRate,
  monthlyContributionNeeded,
} from "@/modules/savings/domain/savings.rules";

describe("progressPercent", () => {
  it("computes a rounded percentage", () => {
    expect(progressPercent(2_500, 10_000)).toBe(25);
  });
  it("handles a zero target", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(100, 0)).toBe(100);
  });
});

describe("remainingToTarget", () => {
  it("never goes negative", () => {
    expect(remainingToTarget(12_000, 10_000)).toBe(0);
    expect(remainingToTarget(3_000, 10_000)).toBe(7_000);
  });
});

describe("savingsRate", () => {
  it("is saved / income as a percent, 0 without income", () => {
    expect(savingsRate(20_000, 100_000)).toBe(20);
    expect(savingsRate(20_000, 0)).toBe(0);
  });
});

describe("monthlyContributionNeeded", () => {
  it("rounds up to meet the goal in time", () => {
    expect(monthlyContributionNeeded(10_000, 3)).toBe(Math.ceil(10_000 / 3));
    expect(monthlyContributionNeeded(0, 5)).toBe(0);
    expect(monthlyContributionNeeded(10_000, 0)).toBe(10_000);
  });
});
