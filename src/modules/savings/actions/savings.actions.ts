"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { savingsGoalInputSchema, contributionSchema } from "@/modules/savings/schemas";
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contribute,
} from "@/modules/savings/services/savings.service";

const PATHS = ["/epargne", "/"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createSavingsGoalAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = savingsGoalInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createSavingsGoal(ctx, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateSavingsGoalAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = savingsGoalInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateSavingsGoal(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function contributeAction(id: string, input: unknown): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Montant invalide.");
  const ctx = await getUserContext();
  try {
    await contribute(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteSavingsGoalAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteSavingsGoal(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
