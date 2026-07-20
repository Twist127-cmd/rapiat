import { z } from "zod";

/** Budget create/update validation. `amount` is decimal units. */
export const budgetInputSchema = z.object({
  categoryId: z.string().min(1, "Catégorie requise"),
  periodType: z.enum(["MONTHLY", "YEARLY"]),
  amount: z
    .number({ message: "Montant invalide" })
    .positive("Le montant doit être positif")
    .max(1_000_000_000, "Montant trop élevé"),
  rollover: z.boolean().optional(),
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;
