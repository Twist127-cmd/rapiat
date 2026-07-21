"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MoreHorizontal } from "lucide-react";

import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  QUICK_ACTION,
  type NavItem,
} from "@/config/navigation";
import {
  QuickTransactionSheet,
  type QuickAccount,
  type QuickCategory,
} from "@/modules/transactions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const SIDE_KEY = "rapiat-nav-side";

/**
 * Floating, expandable navigation bubble (mobile only, < md). A single FAB in
 * the thumb zone that unfolds the primary tabs, a highlighted quick action, and
 * a "Plus" entry for secondary destinations. Replaces the old bottom bar.
 *
 * A11y: `aria-expanded`/`aria-controls` on the FAB, `role=menu`/`menuitem`,
 * focus moves into the menu on open, Escape/scrim/selection close it, and the
 * unfold animation is disabled under `prefers-reduced-motion`.
 */
export function MobileNav({
  accounts,
  categories,
}: {
  accounts: QuickAccount[];
  categories: QuickCategory[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Position preference (right by default, left for left-handed users). Read
  // from localStorage via an external store so it stays SSR-safe.
  const side = useSyncExternalStore(
    () => () => {},
    () => (window.localStorage.getItem(SIDE_KEY) === "left" ? "left" : "right"),
    () => "right" as const,
  );

  const close = useCallback(() => setOpen(false), []);

  // Close on Escape; move focus into the menu on open, back to FAB on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const first = menuRef.current?.querySelector<HTMLElement>("[data-nav-item]");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const alignRight = side === "right";

  return (
    <div className="md:hidden">
      {/* Scrim */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 supports-backdrop-filter:backdrop-blur-xs",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex flex-col",
          alignRight
            ? "right-[calc(1rem+env(safe-area-inset-right))] items-end"
            : "left-[calc(1rem+env(safe-area-inset-left))] items-start",
        )}
      >
        {/* Unfolded items */}
        <div
          ref={menuRef}
          id="mobile-nav-menu"
          role="menu"
          aria-label="Navigation"
          className={cn(
            "mb-3 flex flex-col gap-2",
            alignRight ? "items-end" : "items-start",
            open ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          {open ? (
            <>
              <BubbleItem
                as="button"
                index={0}
                align={alignRight ? "right" : "left"}
                highlight
                icon={<QUICK_ACTION.icon className="size-5" />}
                label={QUICK_ACTION.label}
                onClick={() => {
                  close();
                  setQuickOpen(true);
                }}
              />
              {PRIMARY_NAV_ITEMS.map((item, i) => (
                <BubbleLink
                  key={item.href}
                  item={item}
                  index={i + 1}
                  align={alignRight ? "right" : "left"}
                  active={isActive(pathname, item.href)}
                  onSelect={close}
                />
              ))}
              <BubbleItem
                as="button"
                index={PRIMARY_NAV_ITEMS.length + 1}
                align={alignRight ? "right" : "left"}
                icon={<MoreHorizontal className="size-5" />}
                label="Plus"
                onClick={() => {
                  close();
                  setPlusOpen(true);
                }}
              />
            </>
          ) : null}
        </div>

        {/* FAB */}
        <button
          ref={fabRef}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full shadow-lg ring-1 ring-black/5 transition-transform active:scale-95"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Quick transaction entry */}
      <QuickTransactionSheet
        open={quickOpen}
        onOpenChange={setQuickOpen}
        accounts={accounts}
        categories={categories}
      />

      {/* Secondary destinations */}
      <Sheet open={plusOpen} onOpenChange={setPlusOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Plus</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-1 py-1" aria-label="Autres pages">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setPlusOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Thème</span>
              <ThemeSwitcher />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Clair / sombre</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Session</span>
              <LogoutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function itemStyle(index: number): React.CSSProperties {
  // Staggered entrance; disabled entirely under reduced motion via CSS below.
  return { animationDelay: `${index * 30}ms` };
}

function BubbleLink({
  item,
  index,
  align,
  active,
  onSelect,
}: {
  item: NavItem;
  index: number;
  align: "right" | "left";
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <BubbleItem
      as="link"
      href={item.href}
      index={index}
      align={align}
      active={active}
      icon={<Icon className="size-5" />}
      label={item.label}
      onClick={onSelect}
    />
  );
}

function BubbleItem({
  as,
  href,
  index,
  align,
  active,
  highlight,
  icon,
  label,
  onClick,
}: {
  as: "link" | "button";
  href?: string;
  index: number;
  align: "right" | "left";
  active?: boolean;
  highlight?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const content = (
    <>
      {align === "left" ? (
        <span className="bg-card flex size-11 items-center justify-center rounded-full shadow ring-1 ring-black/5">
          {icon}
        </span>
      ) : null}
      <span
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium shadow ring-1 ring-black/5",
          highlight
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-card",
        )}
      >
        {label}
      </span>
      {align === "right" ? (
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full shadow ring-1 ring-black/5",
            highlight
              ? "bg-primary text-primary-foreground"
              : active
                ? "bg-primary text-primary-foreground"
                : "bg-card",
          )}
        >
          {icon}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 flex items-center gap-2 duration-200",
    align === "right" ? "flex-row" : "flex-row-reverse",
  );

  if (as === "link" && href) {
    return (
      <Link
        href={href}
        role="menuitem"
        data-nav-item
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        style={itemStyle(index)}
        className={className}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      data-nav-item
      onClick={onClick}
      style={itemStyle(index)}
      className={className}
    >
      {content}
    </button>
  );
}
