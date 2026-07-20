import { describe, it, expect } from "vitest";

import {
  effectiveBudgetCents,
  consumedPercent,
  budgetState,
  remainingCents,
} from "@/modules/budgets/domain/budget.rules";

describe("effectiveBudgetCents", () => {
  it("returns the base amount without rollover", () => {
    expect(effectiveBudgetCents(50_000, false, 10_000)).toBe(50_000);
  });
  it("carries the unspent remainder when rollover is on", () => {
    // spent 30000 of 50000 last period -> carry 20000
    expect(effectiveBudgetCents(50_000, true, 30_000)).toBe(70_000);
  });
  it("never carries a negative remainder (overspent last period)", () => {
    expect(effectiveBudgetCents(50_000, true, 60_000)).toBe(50_000);
  });
});

describe("consumedPercent", () => {
  it("computes a rounded percentage", () => {
    expect(consumedPercent(25_000, 50_000)).toBe(50);
    expect(consumedPercent(33_333, 100_000)).toBe(33);
  });
  it("treats spend against a zero budget as 100%", () => {
    expect(consumedPercent(10, 0)).toBe(100);
    expect(consumedPercent(0, 0)).toBe(0);
  });
});

describe("budgetState", () => {
  it("classifies ok / warning / reached / exceeded", () => {
    expect(budgetState(10_000, 100_000)).toBe("ok");
    expect(budgetState(85_000, 100_000)).toBe("warning");
    expect(budgetState(100_000, 100_000)).toBe("reached");
    expect(budgetState(120_000, 100_000)).toBe("exceeded");
  });
});

describe("remainingCents", () => {
  it("can be negative when overspent", () => {
    expect(remainingCents(120_000, 100_000)).toBe(-20_000);
  });
});
