import type { UserScope } from "@/server/user-db";
import { DomainError } from "@/lib/errors";
import type { CategoryKind } from "@/config/constants";
import { emptyToNull } from "@/modules/categories/domain/category.rules";
import type { CategoryInput } from "@/modules/categories/schemas";
import type { CategoryOption, CategorySummary } from "@/modules/categories/types";

/** List all categories with usage counts, ordered by kind then name. */
export async function listCategories({ db }: UserScope): Promise<CategorySummary[]> {
  const rows = await db.category.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind as CategoryKind,
    parentId: row.parentId,
    color: row.color,
    icon: row.icon,
    isDefault: row.isDefault,
    transactionCount: row._count.transactions,
  }));
}

/** Lightweight options for pickers, optionally filtered by kind. */
export async function listCategoryOptions(
  { db }: UserScope,
  kind?: CategoryKind,
): Promise<CategoryOption[]> {
  const rows = await db.category.findMany({
    where: kind ? { kind } : undefined,
    select: { id: true, name: true, kind: true, parentId: true, color: true, icon: true },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({ ...r, kind: r.kind as CategoryKind }));
}

export async function createCategory(scope: UserScope, input: CategoryInput): Promise<void> {
  await scope.db.category.create({
    data: {
      userId: scope.userId,
      name: input.name,
      kind: input.kind,
      parentId: emptyToNull(input.parentId),
      color: input.color,
      icon: input.icon,
    },
  });
}

export async function updateCategory(
  { db }: UserScope,
  id: string,
  input: CategoryInput,
): Promise<void> {
  const parentId = emptyToNull(input.parentId);
  if (parentId === id) {
    throw new DomainError("INVALID", "Une catégorie ne peut pas être sa propre parente.");
  }
  const result = await db.category.updateMany({
    where: { id },
    data: {
      name: input.name,
      kind: input.kind,
      parentId,
      color: input.color,
      icon: input.icon,
    },
  });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Catégorie introuvable.");
}

/**
 * Delete a category. Its transactions keep their history (categoryId set to
 * null by the DB), its children are detached, and any budget on it is removed.
 */
export async function deleteCategory({ db }: UserScope, id: string): Promise<void> {
  const result = await db.category.deleteMany({ where: { id } });
  if (result.count === 0) throw new DomainError("NOT_FOUND", "Catégorie introuvable.");
}
