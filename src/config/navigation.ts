/**
 * Declarative navigation registry.
 *
 * The dashboard shell (sidebar on desktop, bottom bar on mobile) is generated
 * from this list, keeping pages thin and modules self-describing.
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Route path under the (dashboard) group. */
  href: string;
  /** French label shown in the menu. */
  label: string;
  icon: LucideIcon;
  /** Show in the mobile bottom bar (space is limited to the essentials). */
  mobile?: boolean;
  /** Emphasized, raised entry placed at the center of the mobile bottom bar. */
  mobileCenter?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard, mobile: true },
  { href: "/comptes", label: "Comptes", icon: Wallet, mobile: true },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    mobile: true,
    mobileCenter: true,
  },
  { href: "/depenses-fixes", label: "Dépenses fixes", icon: Repeat },
  { href: "/budgets", label: "Budgets", icon: PiggyBank, mobile: true },
  { href: "/epargne", label: "Épargne", icon: Target },
  { href: "/rapports", label: "Rapports", icon: ChartColumn, mobile: true },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];
