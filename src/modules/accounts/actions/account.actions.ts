"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { recordAudit } from "@/server/audit";
import { accountInputSchema } from "@/modules/accounts/schemas";
import {
  createAccount,
  updateAccount,
  setArchived,
  deleteAccount,
} from "@/modules/accounts/services/account.service";

const PATHS = ["/comptes", "/", "/transactions"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createAccountAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = accountInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createAccount(ctx, parsed.data);
    await recordAudit({ userId: ctx.userId, action: "account.create", detail: parsed.data.name });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateAccountAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = accountInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateAccount(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function setAccountArchivedAction(
  id: string,
  archived: boolean,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await setArchived(ctx, id, archived);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteAccount(ctx, id);
    await recordAudit({ userId: ctx.userId, action: "account.delete", detail: id });
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
