"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/server/guards";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import {
  adminCreateUserSchema,
  adminResetPasswordSchema,
} from "@/modules/superadmin/schemas";
import {
  createUser,
  resetPassword,
  setSuperAdmin,
  deleteUser,
} from "@/modules/superadmin/services/superadmin.service";

const revalidate = () =>
  ["/superadmin", "/superadmin/utilisateurs", "/superadmin/journaux"].forEach((p) =>
    revalidatePath(p),
  );

export async function adminCreateUserAction(input: unknown): Promise<ActionResult<null>> {
  const admin = await requireSuperAdmin();
  const parsed = adminCreateUserSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  try {
    await createUser(parsed.data);
    await recordAudit({
      userId: admin.id,
      userEmail: admin.email,
      action: "superadmin.create_user",
      detail: `Création du compte ${parsed.data.email}`,
    });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function adminResetPasswordAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const admin = await requireSuperAdmin();
  const parsed = adminResetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
  try {
    const email = await resetPassword(id, parsed.data.password);
    await recordAudit({
      userId: admin.id,
      userEmail: admin.email,
      action: "superadmin.reset_password",
      detail: `Réinitialisation du mot de passe de ${email}`,
    });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function adminSetSuperAdminAction(
  id: string,
  value: boolean,
): Promise<ActionResult<null>> {
  const admin = await requireSuperAdmin();
  try {
    const email = await setSuperAdmin(id, value);
    await recordAudit({
      userId: admin.id,
      userEmail: admin.email,
      action: value ? "superadmin.promote" : "superadmin.demote",
      detail: `${value ? "Promotion" : "Rétrogradation"} de ${email}`,
    });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function adminDeleteUserAction(id: string): Promise<ActionResult<null>> {
  const admin = await requireSuperAdmin();
  try {
    const email = await deleteUser(id, admin.id);
    await recordAudit({
      userId: admin.id,
      userEmail: admin.email,
      action: "superadmin.delete_user",
      detail: `Suppression du compte ${email}`,
    });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
