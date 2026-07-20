import type { ReactNode } from "react";

import { getUserContext } from "@/server/data-access";
import { SideNav, BottomNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BrandLogo } from "@/components/brand-logo";
import { env } from "@/lib/env";

/**
 * Protected app shell. Defense-in-depth: middleware already blocks
 * unauthenticated access; we re-check here via getUserContext (which calls the
 * session firewall). Responsive: sidebar on desktop, bottom bar on mobile.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await getUserContext();
  const appName = env.NEXT_PUBLIC_APP_NAME;

  return (
    <div className="flex min-h-svh">
      <SideNav appName={appName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur md:justify-end">
          <BrandLogo appName={appName} size={28} className="md:hidden" />
          <div className="flex items-center gap-2">
            <ThemeSwitcher className="hidden sm:flex" />
            <span className="text-muted-foreground hidden text-sm lg:inline">{ctx.email}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
