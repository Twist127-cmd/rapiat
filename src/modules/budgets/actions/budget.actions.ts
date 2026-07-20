"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { budgetInputSchema } from "@/modules/budgets/schemas";
import {
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/modules/budgets/services/budget.service";

const PATHS = ["/budgets", "/"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createBudgetAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = budgetInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createBudget(ctx, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateBudgetAction(id: string, input: unknown): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = budgetInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateBudget(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteBudget(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
