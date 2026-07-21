import { z } from "zod";

/** Create a user from the console. */
export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Au moins 8 caractères").max(200),
  isSuperAdmin: z.boolean().optional(),
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

/** Manual password reset by the super-admin. */
export const adminResetPasswordSchema = z.object({
  password: z.string().min(8, "Au moins 8 caractères").max(200),
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

/** Audit-log filters for the console log viewer. */
export const auditFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  text: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  take: z.number().int().positive().max(500).optional(),
  skip: z.number().int().min(0).optional(),
});
export type AuditFilter = z.infer<typeof auditFilterSchema>;
