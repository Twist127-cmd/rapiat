import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Public auth shell: a branded panel on the left (desktop) and the form on the
 * right. The middleware already redirects authenticated users away from here.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Branded panel — the logo's navy & gold on a rich gradient. */}
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between p-10 lg:flex">
        <BrandLogo appName="Rapiat" size={44} className="text-primary-foreground" />
        <div className="space-y-4">
          <h2 className="font-heading text-4xl leading-tight font-semibold">
            Près de ses sous, sans se prendre la tête.
          </h2>
          <p className="max-w-md text-base opacity-90">
            Suivez vos revenus, vos dépenses fixes et variables, votre épargne et vos budgets —
            dans une app claire, élégante et malicieuse.
          </p>
        </div>
        <p className="text-sm opacity-70">© {new Date().getFullYear()} Rapiat</p>
      </div>

      {/* Form side. */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo appName="Rapiat" size={44} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
