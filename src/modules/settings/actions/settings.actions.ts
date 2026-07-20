"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getUserContext } from "@/server/data-access";
import { signOut } from "@/server/auth";
import { recordAudit } from "@/server/audit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { THEMES } from "@/config/constants";
import { profileSchema, passwordSchema } from "@/modules/settings/schemas";
import {
  updateProfile,
  changePassword,
  deleteAccountData,
} from "@/modules/settings/services/settings.service";

/** Persist the chosen visual theme family to the user profile. */
export async function saveThemePreferenceAction(family: string): Promise<ActionResult<null>> {
  if (family !== THEMES.classique && family !== THEMES.marie) return fail("Thème inconnu.");
  const { userId } = await getUserContext();
  await db.user.update({ where: { id: userId }, data: { themePreference: family } });
  return ok(null);
}

export async function updateProfileAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const { userId } = await getUserContext();
  try {
    await updateProfile(userId, parsed.data);
    ["/parametres", "/", "/transactions", "/rapports"].forEach((p) => revalidatePath(p));
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const { userId } = await getUserContext();
  try {
    await changePassword(userId, parsed.data);
    await recordAudit({ userId, action: "password.change" });
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

/** Permanently delete the account and all data, then sign out. */
export async function deleteAccountAction(): Promise<ActionResult<null>> {
  const { userId, email } = await getUserContext();
  try {
    await recordAudit({ userId, userEmail: email, action: "account.delete" });
    await deleteAccountData(userId);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
  await signOut({ redirectTo: "/login" });
  return ok(null);
}
