import { describe, it, expect } from "vitest";

import {
  computeBalance,
  balanceEffectOnOwnAccount,
  EMPTY_FLOWS,
} from "@/modules/accounts/domain/account.rules";

describe("computeBalance", () => {
  it("returns the opening balance when there are no movements", () => {
    expect(computeBalance(10_000, EMPTY_FLOWS)).toBe(10_000);
  });

  it("adds income and incoming transfers, subtracts expenses and outgoing transfers", () => {
    const balance = computeBalance(5_000, {
      incomeCents: 20_000,
      expenseCents: 8_000,
      transferOutCents: 3_000,
      transferInCents: 1_500,
    });
    // 5000 + 20000 - 8000 - 3000 + 1500
    expect(balance).toBe(15_500);
  });

  it("can go negative (e.g. credit card)", () => {
    expect(
      computeBalance(0, { ...EMPTY_FLOWS, expenseCents: 4_200 }),
    ).toBe(-4_200);
  });
});

describe("balanceEffectOnOwnAccount", () => {
  it("adds income", () => {
    expect(balanceEffectOnOwnAccount("INCOME", 5_000)).toBe(5_000);
  });
  it("subtracts expense", () => {
    expect(balanceEffectOnOwnAccount("EXPENSE", 5_000)).toBe(-5_000);
  });
  it("subtracts transfer from the source account", () => {
    expect(balanceEffectOnOwnAccount("TRANSFER", 5_000)).toBe(-5_000);
  });
});
