import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

/** Savings goal validation. `target`/`current` are decimal units. */
export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(120, "Nom trop long"),
  target: z
    .number({ message: "Montant invalide" })
    .positive("La cible doit être positive")
    .max(1_000_000_000, "Montant trop élevé"),
  current: z
    .number({ message: "Montant invalide" })
    .min(0, "Ne peut pas être négatif")
    .max(1_000_000_000, "Montant trop élevé"),
  deadline: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide"),
  accountId: z.string().optional().or(z.literal("")),
  color: z.string().regex(HEX_COLOR, "Couleur invalide"),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalInputSchema>;

/** A manual contribution (or withdrawal, when negative) to a goal. */
export const contributionSchema = z.object({
  amount: z
    .number({ message: "Montant invalide" })
    .refine((v) => v !== 0, "Le montant ne peut pas être nul"),
});

export type ContributionInput = z.infer<typeof contributionSchema>;
