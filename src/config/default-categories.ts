import type { CategoryKind } from "@/config/constants";

/**
 * Default category set provisioned for every new user (and by the seed).
 * Fully customizable afterwards. Colors/icons give the dashboard donut and
 * lists a sensible starting palette; icon names map to lucide-react.
 */
export interface DefaultCategory {
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  // --- Revenus ---
  { name: "Salaire", kind: "INCOME", color: "#2f9e6f", icon: "banknote" },
  { name: "Primes & bonus", kind: "INCOME", color: "#4bbf8a", icon: "gift" },
  { name: "Revenus divers", kind: "INCOME", color: "#7bd3b0", icon: "coins" },
  // --- Dépenses ---
  { name: "Logement", kind: "EXPENSE", color: "#1e2a4a", icon: "home" },
  { name: "Alimentation", kind: "EXPENSE", color: "#c9a227", icon: "shopping-cart" },
  { name: "Transport", kind: "EXPENSE", color: "#3f6db0", icon: "car" },
  { name: "Loisirs", kind: "EXPENSE", color: "#e6a4b4", icon: "party-popper" },
  { name: "Santé", kind: "EXPENSE", color: "#e0685f", icon: "heart-pulse" },
  { name: "Abonnements", kind: "EXPENSE", color: "#8b5cf6", icon: "repeat" },
  { name: "Restaurants & sorties", kind: "EXPENSE", color: "#f0913f", icon: "utensils" },
  { name: "Vêtements", kind: "EXPENSE", color: "#d16ba5", icon: "shirt" },
  { name: "Divers", kind: "EXPENSE", color: "#6b7280", icon: "ellipsis" },
] as const;
