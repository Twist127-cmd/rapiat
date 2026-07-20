import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

/**
 * Dashboard home. Placeholder scaffold — the full summary, charts and upcoming
 * items are built in the reports/dashboard step.
 */
export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-3xl font-semibold">Bonjour {ctx.profileName ?? ""} 👋</h1>
      <p className="text-muted-foreground">
        Bienvenue sur Rapiat. Votre tableau de bord financier arrive ici.
      </p>
    </div>
  );
}
