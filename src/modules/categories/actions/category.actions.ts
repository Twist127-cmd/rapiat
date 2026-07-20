"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { categoryInputSchema } from "@/modules/categories/schemas";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/modules/categories/services/category.service";

const PATHS = ["/parametres", "/transactions", "/budgets", "/rapports", "/"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createCategoryAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createCategory(ctx, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateCategory(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteCategory(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
