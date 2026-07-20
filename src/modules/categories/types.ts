import type { CategoryKind } from "@/config/constants";

export interface CategorySummary {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  color: string;
  icon: string;
  isDefault: boolean;
  transactionCount: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  color: string;
  icon: string;
}
