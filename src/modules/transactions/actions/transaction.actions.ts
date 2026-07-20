"use server";

import { revalidatePath } from "next/cache";

import { getUserContext } from "@/server/data-access";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { transactionInputSchema } from "@/modules/transactions/schemas";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  duplicateTransaction,
  bulkDeleteTransactions,
} from "@/modules/transactions/services/transaction.service";

const PATHS = ["/transactions", "/", "/comptes", "/budgets", "/rapports", "/epargne"];
const revalidate = () => PATHS.forEach((p) => revalidatePath(p));

export async function createTransactionAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await createTransaction(ctx, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function updateTransactionAction(
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const ctx = await getUserContext();
  try {
    await updateTransaction(ctx, id, parsed.data);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await deleteTransaction(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function duplicateTransactionAction(id: string): Promise<ActionResult<null>> {
  if (!id) return fail("Identifiant manquant.");
  const ctx = await getUserContext();
  try {
    await duplicateTransaction(ctx, id);
    revalidate();
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}

export async function bulkDeleteTransactionsAction(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  const ctx = await getUserContext();
  try {
    const count = await bulkDeleteTransactions(ctx, ids);
    revalidate();
    return ok({ count });
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    throw error;
  }
}
