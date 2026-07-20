/** Categories module public surface. */
export { listCategories, listCategoryOptions } from "./services/category.service";
export { CategoriesManager } from "./components/CategoriesManager";
export { buildCategoryTree } from "./domain/category.rules";
export { categoryInputSchema, type CategoryInput } from "./schemas";
export type { CategorySummary, CategoryOption } from "./types";
