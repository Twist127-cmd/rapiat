/** Pure domain helpers for accounts. No framework/DB dependencies. */

/** Aggregated movement totals affecting a single account (all in cents). */
export interface AccountFlows {
  incomeCents: number;
  expenseCents: number;
  /** Transfers leaving this account (it is the source). */
  transferOutCents: number;
  /** Transfers arriving into this account (it is the destination). */
  transferInCents: number;
}

export const EMPTY_FLOWS: AccountFlows = {
  incomeCents: 0,
  expenseCents: 0,
  transferOutCents: 0,
  transferInCents: 0,
};

/**
 * Current balance of an account, derived from its opening balance and the sum
 * of its movements. Balances are never stored, so they can never drift.
 */
export function computeBalance(initialCents: number, flows: AccountFlows): number {
  return (
    initialCents +
    flows.incomeCents -
    flows.expenseCents -
    flows.transferOutCents +
    flows.transferInCents
  );
}

/**
 * Effect (signed cents) of a transaction on the balance of the account it is
 * booked against (`accountId`). Transfers reduce the source account.
 */
export function balanceEffectOnOwnAccount(
  type: "INCOME" | "EXPENSE" | "TRANSFER",
  amountCents: number,
): number {
  switch (type) {
    case "INCOME":
      return amountCents;
    case "EXPENSE":
    case "TRANSFER":
      return -amountCents;
    default:
      return 0;
  }
}
