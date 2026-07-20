"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { recurringInputSchema } from "@/modules/recurring/schemas";
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  setRecurringActive,
  generateDueTransactions,
} from "@/modules/recurring/services/recurring.service";

const PATHS = ["/depenses-fixes", "/transactions", "/", "/budgets", "/rapports"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createRecurringAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = recurringInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createRecurring(ctx, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateRecurringAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = recurringInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateRecurring(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function setRecurringActiveAction(
  id: string,
  active: boolean,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await setRecurringActive(ctx, id, active);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteRecurringAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteRecurring(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

/** Materialize any due recurring transactions (called on app open). */
export async function generateDueTransactionsAction(): Promise<ActionResult<{ count: number }>> {
  const ctx = await getUserContext();
  const count = await generateDueTransactions(ctx);
  if (count > 0) revalidate();
  return ok({ count });
}
