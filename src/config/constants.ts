/** Application-wide constants (no business logic). */

export const DEFAULT_CURRENCY = "CHF";
export const DEFAULT_TIMEZONE = "Europe/Zurich";
export const DEFAULT_DATE_FORMAT = "dd/MM/yyyy";

/** Currencies a user can choose. */
export const SUPPORTED_CURRENCIES = [
  { code: "CHF", label: "Franc suisse (CHF)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "Dollar US ($)" },
  { code: "GBP", label: "Livre sterling (£)" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/** Account types, mirrored from the Prisma `AccountType` enum. */
export const ACCOUNT_TYPES = {
  CHECKING: "CHECKING",
  SAVINGS: "SAVINGS",
  CASH: "CASH",
  CREDIT: "CREDIT",
} as const;
export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: "Compte courant",
  SAVINGS: "Épargne",
  CASH: "Espèces",
  CREDIT: "Carte de crédit",
};

/** Transaction types, mirrored from the Prisma `TransactionType` enum. */
export const TRANSACTION_TYPES = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
} as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Revenu",
  EXPENSE: "Dépense",
  TRANSFER: "Transfert",
};

/** Expense kinds, mirrored from the Prisma `ExpenseKind` enum. */
export const EXPENSE_KINDS = {
  FIXED: "FIXED",
  VARIABLE: "VARIABLE",
} as const;
export type ExpenseKind = (typeof EXPENSE_KINDS)[keyof typeof EXPENSE_KINDS];

export const EXPENSE_KIND_LABELS: Record<ExpenseKind, string> = {
  FIXED: "Fixe",
  VARIABLE: "Variable",
};

/** Recurrence frequencies, mirrored from the Prisma `Frequency` enum. */
export const FREQUENCIES = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
  CUSTOM: "CUSTOM",
} as const;
export type Frequency = (typeof FREQUENCIES)[keyof typeof FREQUENCIES];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
  YEARLY: "Annuelle",
  CUSTOM: "Personnalisée (jours)",
};

export const CATEGORY_KINDS = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[keyof typeof CATEGORY_KINDS];

export const BUDGET_PERIODS = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[keyof typeof BUDGET_PERIODS];

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  MONTHLY: "Mensuel",
  YEARLY: "Annuel",
};

/** Visual theme families (light/dark handled separately by next-themes). */
export const THEMES = {
  classique: "classique",
  marie: "marie",
} as const;
export type ThemeFamily = (typeof THEMES)[keyof typeof THEMES];
