/**
 * Monetary helpers.
 *
 * All amounts are stored and manipulated as INTEGER CENTS to avoid
 * floating-point rounding errors in accounting. Never store or sum money as a
 * float. Conversion to/from a decimal string happens only at the UI edge.
 *
 * The display currency is per-user (User.currency); pass it to formatMoney.
 */

/** Locale used to format each supported currency. */
const CURRENCY_LOCALE: Record<string, string> = {
  CHF: "fr-CH",
  EUR: "fr-FR",
  USD: "en-US",
  GBP: "en-GB",
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const code = CURRENCY_LOCALE[currency] ? currency : "CHF";
  let formatter = formatterCache.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCY_LOCALE[code] ?? "fr-CH", {
      style: "currency",
      currency: code,
    });
    formatterCache.set(code, formatter);
  }
  return formatter;
}

/** Format integer cents in the given currency, e.g. 12500 -> "CHF 125.00". */
export function formatMoney(cents: number, currency = "CHF"): string {
  return getFormatter(currency).format(cents / 100);
}

/**
 * Format with an explicit sign for signed flows, e.g. -4500 -> "-CHF 45.00",
 * 4500 -> "+CHF 45.00". Zero has no sign.
 */
export function formatSignedMoney(cents: number, currency = "CHF"): string {
  if (cents === 0) return formatMoney(0, currency);
  const sign = cents > 0 ? "+" : "-";
  return `${sign}${formatMoney(Math.abs(cents), currency)}`;
}

/**
 * Convert a user-entered decimal amount (e.g. "125.50" or 125.5) into integer
 * cents. Rounds to the nearest cent. Throws on non-finite input.
 */
export function toCents(amount: number | string): number {
  const value = typeof amount === "string" ? Number(amount.replace(",", ".")) : amount;
  if (!Number.isFinite(value)) {
    throw new Error(`Montant invalide: ${amount}`);
  }
  return Math.round(value * 100);
}

/** Convert integer cents back into a decimal number of units (for inputs). */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Sum a list of integer-cent amounts. */
export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((total, cents) => total + cents, 0);
}
