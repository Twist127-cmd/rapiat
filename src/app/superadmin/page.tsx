import Link from "next/link";
import { Users, Wallet, ArrowLeftRight, LogIn, ScrollText, ChevronRight } from "lucide-react";

import { getStats, listAuditLogs } from "@/modules/superadmin";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Date(d).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SuperadminHomePage() {
  const [stats, recent] = await Promise.all([getStats(), listAuditLogs({ take: 12 })]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Console super-admin</h1>
        <p className="text-muted-foreground text-sm">
          Supervision de la plateforme : comptes, mots de passe, journaux.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={String(stats.userCount)}
          icon={<Users className="size-4" />}
          hint={`${stats.superAdminCount} super-admin`}
        />
        <StatCard
          label="Comptes bancaires"
          value={String(stats.accountCount)}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Transactions"
          value={String(stats.transactionCount)}
          icon={<ArrowLeftRight className="size-4" />}
        />
        <StatCard
          label="Connexions (24 h)"
          value={String(stats.logins24h)}
          icon={<LogIn className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-3 lg:col-span-1">
          <Link href="/superadmin/utilisateurs">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-3 py-5">
                <Users className="text-primary size-5" />
                <div className="flex-1">
                  <p className="font-medium">Gérer les utilisateurs</p>
                  <p className="text-muted-foreground text-xs">Créer, réinitialiser, supprimer</p>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/superadmin/journaux">
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-3 py-5">
                <ScrollText className="text-primary size-5" />
                <div className="flex-1">
                  <p className="font-medium">Journaux complets</p>
                  <p className="text-muted-foreground text-xs">Tous les événements, filtrables</p>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Activité récente</CardTitle>
            <Link href="/superadmin/journaux" className="text-primary text-sm hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune activité.</p>
            ) : (
              recent.rows.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0 tabular-nums">
                    {fmt(r.createdAt)}
                  </span>
                  <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                    {r.action}
                  </Badge>
                  <span className="text-muted-foreground truncate">
                    {r.userEmail ?? ""} {r.detail ? `· ${r.detail}` : ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
