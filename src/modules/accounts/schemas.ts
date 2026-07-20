import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

/**
 * Account create/update validation. `initialBalance` is decimal units (the
 * service converts to integer cents). Input and output types are kept
 * identical (no `coerce`/`default`) so react-hook-form's resolver generics line
 * up; the form always supplies every field.
 */
export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80, "Nom trop long"),
  type: z.enum(["CHECKING", "SAVINGS", "CASH", "CREDIT"]),
  initialBalance: z
    .number({ message: "Montant invalide" })
    .finite("Montant invalide")
    .min(-1_000_000_000, "Montant trop faible")
    .max(1_000_000_000, "Montant trop élevé"),
  currency: z.enum(["CHF", "EUR", "USD", "GBP"]),
  color: z.string().regex(HEX_COLOR, "Couleur invalide"),
  icon: z.string().trim().min(1).max(40),
  archived: z.boolean().optional(),
});

export type AccountInput = z.infer<typeof accountInputSchema>;
