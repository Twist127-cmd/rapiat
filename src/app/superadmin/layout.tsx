import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { requireSuperAdmin } from "@/server/guards";
import { SuperadminNav } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Console super-admin",
};

// Session-guarded, cross-user data — never statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Separate super-admin console shell — distinct from the user app (no piggy
 * theme, dedicated navy chrome). Guarded: non-super-admins get a 404 so the
 * console's existence is not disclosed.
 */
export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col">
      <header
        className="sticky top-0 z-30 text-white shadow-sm"
        style={{ backgroundColor: "#1e2a4a" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 font-semibold whitespace-nowrap">
            <span
              className="flex size-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#c9a227", color: "#1e2a4a" }}
            >
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-heading">Rapiat · Console</span>
          </div>
          <div className="flex-1">
            <SuperadminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
