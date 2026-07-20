import { z } from "zod";

/**
 * Transaction create/update validation. `amount` is decimal units (positive),
 * `date` a "YYYY-MM-DD" wall-clock day; the service converts to cents and a UTC
 * instant. Transfers must target a different account.
 */
export const transactionInputSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: z
      .number({ message: "Montant invalide" })
      .positive("Le montant doit être positif")
      .max(1_000_000_000, "Montant trop élevé"),
    date: z
      .string()
      .min(1, "Date requise")
      .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide"),
    accountId: z.string().min(1, "Compte requis"),
    categoryId: z.string().optional().or(z.literal("")),
    transferAccountId: z.string().optional().or(z.literal("")),
    note: z.string().trim().max(500, "Note trop longue").optional().or(z.literal("")),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    expenseKind: z.enum(["FIXED", "VARIABLE"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (!data.transferAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["transferAccountId"],
          message: "Choisissez le compte de destination.",
        });
      } else if (data.transferAccountId === data.accountId) {
        ctx.addIssue({
          code: "custom",
          path: ["transferAccountId"],
          message: "Le compte de destination doit être différent.",
        });
      }
    }
  });

export type TransactionInput = z.infer<typeof transactionInputSchema>;

/** Filters accepted by the transactions list. */
export const transactionFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  expenseKind: z.enum(["FIXED", "VARIABLE"]).optional(),
  text: z.string().optional(),
  tag: z.string().optional(),
  take: z.number().int().positive().max(500).optional(),
  skip: z.number().int().min(0).optional(),
});
