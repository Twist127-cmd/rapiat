import {
  Wallet,
  PiggyBank,
  Banknote,
  CreditCard,
  Landmark,
  Coins,
  Gift,
  Home,
  ShoppingCart,
  Car,
  PartyPopper,
  HeartPulse,
  Repeat,
  Utensils,
  Shirt,
  Ellipsis,
  Tag,
  Target,
  Plane,
  GraduationCap,
  Dog,
  Baby,
  Dumbbell,
  Fuel,
  Phone,
  Zap,
  Droplets,
  Briefcase,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon registry keyed by kebab-case name (as stored on accounts and
 * categories). A curated set keeps the client bundle predictable and gives the
 * icon picker a stable list. Unknown names fall back to `tag`.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "credit-card": CreditCard,
  landmark: Landmark,
  coins: Coins,
  gift: Gift,
  home: Home,
  "shopping-cart": ShoppingCart,
  car: Car,
  "party-popper": PartyPopper,
  "heart-pulse": HeartPulse,
  repeat: Repeat,
  utensils: Utensils,
  shirt: Shirt,
  ellipsis: Ellipsis,
  tag: Tag,
  target: Target,
  plane: Plane,
  "graduation-cap": GraduationCap,
  dog: Dog,
  baby: Baby,
  dumbbell: Dumbbell,
  fuel: Fuel,
  phone: Phone,
  zap: Zap,
  droplets: Droplets,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function resolveIcon(name: string | null | undefined): LucideIcon {
  return (name && ICON_REGISTRY[name]) || Tag;
}

/** A pleasant default palette offered by the color pickers. */
export const COLOR_PALETTE = [
  "#1e2a4a", // navy
  "#c9a227", // gold
  "#e6a4b4", // blush
  "#2f9e6f", // green
  "#3f6db0", // blue
  "#e0685f", // coral
  "#8b5cf6", // violet
  "#f0913f", // orange
  "#0ea5b7", // teal
  "#6b7280", // slate
] as const;
