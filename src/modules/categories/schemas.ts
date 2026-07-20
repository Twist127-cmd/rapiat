import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{6})$/;

/** Category create/update validation. `parentId` empty string means "no parent". */
export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80, "Nom trop long"),
  kind: z.enum(["INCOME", "EXPENSE"]),
  parentId: z.string().optional().or(z.literal("")),
  color: z.string().regex(HEX_COLOR, "Couleur invalide"),
  icon: z.string().trim().min(1).max(40),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
