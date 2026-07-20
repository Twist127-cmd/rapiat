import { z } from "zod";

/**
 * Recurring rule validation. `amount` is decimal units; `startDate` seeds the
 * first `nextRunDate`. `interval` is a multiplier of the frequency (days for
 * CUSTOM).
 */
export const recurringInputSchema = z
  .object({
    label: z.string().trim().min(1, "Libellé requis").max(120, "Libellé trop long"),
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z
      .number({ message: "Montant invalide" })
      .positive("Le montant doit être positif")
      .max(1_000_000_000, "Montant trop élevé"),
    frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
    interval: z
      .number({ message: "Intervalle invalide" })
      .int("Nombre entier requis")
      .min(1, "Au moins 1")
      .max(365, "Intervalle trop grand"),
    startDate: z
      .string()
      .min(1, "Date requise")
      .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide"),
    endDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide"),
    accountId: z.string().min(1, "Compte requis"),
    categoryId: z.string().optional().or(z.literal("")),
    note: z.string().trim().max(500).optional().or(z.literal("")),
    expenseKind: z.enum(["FIXED", "VARIABLE"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "La fin doit être après le début.",
    path: ["endDate"],
  });

export type RecurringInput = z.infer<typeof recurringInputSchema>;
