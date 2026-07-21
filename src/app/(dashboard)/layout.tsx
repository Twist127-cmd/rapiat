import type { ReactNode } from "react";

import { getUserContext } from "@/server/data-access";
import { SideNav } from "@/components/app-nav";
import { MobileNav } from "@/components/mobile-nav";
import { MobileHeader } from "@/components/mobile-header";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { listAccountOptions } from "@/modules/accounts";
import { listCategoryOptions } from "@/modules/categories";
import { env } from "@/lib/env";

/**
 * Protected app shell. Defense-in-depth: middleware already blocks
 * unauthenticated access; we re-check here via getUserContext. Responsive:
 * sidebar on desktop, a floating expandable bubble on mobile (no bottom bar).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await getUserContext();
  const appName = env.NEXT_PUBLIC_APP_NAME;

  const [accounts, categories] = await Promise.all([
    listAccountOptions(ctx),
    listCategoryOptions(ctx),
  ]);

  return (
    <div className="flex min-h-svh">
      <SideNav appName={appName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur pt-[calc(0.75rem+env(safe-area-inset-top))] md:justify-end">
          <MobileHeader appName={appName} />
          <div className="hidden items-center gap-2 md:flex">
            <ThemeSwitcher />
            <span className="text-muted-foreground hidden text-sm lg:inline">{ctx.email}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          color: c.color,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
