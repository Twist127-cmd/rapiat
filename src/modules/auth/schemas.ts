import { z } from "zod";

/** Login form / credentials validation. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Sign-up form validation. */
export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom est requis").max(80, "Nom trop long"),
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
      .max(200, "Mot de passe trop long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
