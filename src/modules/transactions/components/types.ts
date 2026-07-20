import type { CategoryKind } from "@/config/constants";

/** Minimal shapes the transaction UI needs for its pickers. */
export interface AccountOption {
  id: string;
  name: string;
}

export interface CategoryChoice {
  id: string;
  name: string;
  kind: CategoryKind;
}
