/** Pure domain helpers for transactions. No framework/DB dependencies. */

export type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

/**
 * Effect of a transaction on net worth / cash flow. Income is positive,
 * expense negative; a transfer is internal and nets to zero.
 */
export function netEffect(type: TxType, amountCents: number): number {
  if (type === "INCOME") return amountCents;
  if (type === "EXPENSE") return -amountCents;
  return 0;
}

/** A transfer must target a different, existing account. */
export function isTransferValid(
  accountId: string,
  transferAccountId: string | null | undefined,
): boolean {
  return Boolean(transferAccountId) && transferAccountId !== accountId;
}

/** Parse a free-text "tag1, tag2" input into a clean, de-duplicated list. */
export function parseTagsInput(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (tag) seen.add(tag);
  }
  return Array.from(seen).slice(0, 20);
}

/** Render a tag list back into the comma-separated input value. */
export function tagsToInput(tags: readonly string[]): string {
  return tags.join(", ");
}
