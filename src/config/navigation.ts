/**
 * Declarative navigation registry.
 *
 * `NAV_ITEMS` drives the desktop sidebar (all entries, in order). The mobile
 * floating bubble is generated from the same registry, split into:
 *   - primary tabs (shown directly in the fan),
 *   - secondary entries (grouped under a "Plus" sheet),
 * plus a dedicated quick action ("+ Nouvelle transaction").
 */
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  Target,
  ChartColumn,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/comptes", label: "Comptes", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/depenses-fixes", label: "Dépenses fixes", icon: Repeat },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/epargne", label: "Épargne", icon: Target },
  { href: "/rapports", label: "Rapports", icon: ChartColumn },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

/** Hrefs promoted to the mobile bubble's main fan (order matters). */
const PRIMARY_HREFS = ["/", "/transactions", "/budgets", "/rapports"] as const;

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = PRIMARY_HREFS.map(
  (href) => NAV_ITEMS.find((i) => i.href === href)!,
);

/** The rest, grouped under "Plus" on mobile. */
export const SECONDARY_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(
  (i) => !PRIMARY_HREFS.includes(i.href as (typeof PRIMARY_HREFS)[number]),
);

/** The emphasized quick action surfaced first in the bubble. */
export const QUICK_ACTION = {
  label: "Nouvelle transaction",
  icon: Plus,
} as const;

/** Screen titles shown in the compact mobile header, by route prefix. */
export const SCREEN_TITLES: Record<string, string> = {
  "/": "Tableau de bord",
  "/comptes": "Comptes",
  "/transactions": "Transactions",
  "/depenses-fixes": "Dépenses fixes",
  "/budgets": "Budgets",
  "/epargne": "Épargne",
  "/rapports": "Rapports",
  "/parametres": "Paramètres",
};

export function screenTitle(pathname: string): string {
  if (pathname === "/") return SCREEN_TITLES["/"]!;
  const match = Object.keys(SCREEN_TITLES)
    .filter((h) => h !== "/")
    .find((h) => pathname.startsWith(h));
  return match ? SCREEN_TITLES[match]! : "Rapiat";
}
