/** Pure domain helpers for categories. No framework/DB dependencies. */

export interface CategoryNodeInput {
  id: string;
  name: string;
  parentId: string | null;
}

export interface CategoryTreeNode<T extends CategoryNodeInput> {
  node: T;
  children: T[];
}

/** Trim a free-text value, returning null when empty. */
export function emptyToNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Group flat categories into a one-level parent/child tree. Roots are the
 * categories without a parent (or whose parent is absent from the set); each
 * root carries its direct children. Categories are kept in input order.
 */
export function buildCategoryTree<T extends CategoryNodeInput>(
  categories: readonly T[],
): CategoryTreeNode<T>[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenOf = new Map<string, T[]>();
  const roots: T[] = [];

  for (const category of categories) {
    if (category.parentId && byId.has(category.parentId)) {
      const list = childrenOf.get(category.parentId) ?? [];
      list.push(category);
      childrenOf.set(category.parentId, list);
    } else {
      roots.push(category);
    }
  }

  return roots.map((node) => ({ node, children: childrenOf.get(node.id) ?? [] }));
}

/**
 * Guard against cycles / self-parenting when choosing a parent category.
 * A category cannot be its own parent, nor (in this one-level model) be the
 * parent of a category that is already a parent.
 */
export function isValidParent(
  categoryId: string | null,
  parentId: string | null,
  existingParentIds: ReadonlySet<string>,
): boolean {
  if (!parentId) return true;
  if (parentId === categoryId) return false;
  // The chosen parent must itself be a root (one level of nesting only).
  return !existingParentIds.has(categoryId ?? "");
}
