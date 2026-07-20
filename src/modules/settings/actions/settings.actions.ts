"use server";

import { db } from "@/lib/db";
import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { THEMES } from "@/config/constants";

/**
 * Persist the chosen visual theme family to the user profile so it follows them
 * across devices. The UI already applies it instantly client-side; this just
 * records the preference.
 */
export async function saveThemePreferenceAction(
  family: string,
): Promise<ActionResult<null>> {
  if (family !== THEMES.classique && family !== THEMES.marie) {
    return fail("Thème inconnu.");
  }
  const { userId } = await getUserContext();
  await db.user.update({ where: { id: userId }, data: { themePreference: family } });
  return ok(null);
}
