import { describe, it, expect } from "vitest";

import {
  netEffect,
  isTransferValid,
  parseTagsInput,
  tagsToInput,
} from "@/modules/transactions/domain/transaction.rules";

describe("netEffect", () => {
  it("income is positive, expense negative, transfer neutral", () => {
    expect(netEffect("INCOME", 1000)).toBe(1000);
    expect(netEffect("EXPENSE", 1000)).toBe(-1000);
    expect(netEffect("TRANSFER", 1000)).toBe(0);
  });
});

describe("isTransferValid", () => {
  it("requires a different, non-empty destination", () => {
    expect(isTransferValid("a", "b")).toBe(true);
    expect(isTransferValid("a", "a")).toBe(false);
    expect(isTransferValid("a", "")).toBe(false);
    expect(isTransferValid("a", null)).toBe(false);
  });
});

describe("parseTagsInput / tagsToInput", () => {
  it("splits, trims, de-duplicates and drops empties", () => {
    expect(parseTagsInput("  vacances, courses ,vacances,, ")).toEqual(["vacances", "courses"]);
    expect(parseTagsInput("")).toEqual([]);
    expect(parseTagsInput(null)).toEqual([]);
  });
  it("round-trips to a comma string", () => {
    expect(tagsToInput(["a", "b"])).toBe("a, b");
  });
});
