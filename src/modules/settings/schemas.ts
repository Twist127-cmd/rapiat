import { z } from "zod";

/** Profile & preferences. */
export const profileSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80, "Nom trop long"),
  currency: z.enum(["CHF", "EUR", "USD", "GBP"]),
  timezone: z.string().trim().min(1, "Fuseau requis").max(60),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Password change. */
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Au moins 8 caractères")
      .max(200, "Mot de passe trop long"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type PasswordInput = z.infer<typeof passwordSchema>;
