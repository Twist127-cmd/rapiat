import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, CalendarClock } from "lucide-react";

import { getUserContext } from "@/server/data-access";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { StatCard } from "@/components/stat-card";
import { ProgressBar } from "@/components/progress-bar";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConsolidatedBalance } from "@/modules/accounts";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrendAndBalance,
  CategoryDonut,
  TrendBars,
  BalanceArea,
} from "@/modules/reports";
import { listBudgets } from "@/modules/budgets";
import { listSavingsGoals } from "@/modules/savings";
import { listRecentTransactions } from "@/modules/transactions";
import { listRecurring, generateDueTransactions } from "@/modules/recurring";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  await generateDueTransactions(ctx);

  const [balance, summary, donut, trendBalance, budgets, goals, recent, recurring] =
    await Promise.all([
      getConsolidatedBalance(ctx),
      getMonthlySummary(ctx),
      getCategoryBreakdown(ctx),
      getTrendAndBalance(ctx, 6),
      listBudgets(ctx),
      listSavingsGoals(ctx),
      listRecentTransactions(ctx, 6),
      listRecurring(ctx),
    ]);

  const currency = ctx.currency;
  const topBudgets = [...budgets].sort((a, b) => b.percent - a.percent).slice(0, 4);
  const topGoals = goals.slice(0, 3);
  const upcoming = recurring.filter((r) => r.active).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">
          Bonjour {ctx.profileName ?? ""} 👋
        </h1>
        <p className="text-muted-foreground">Voici l'état de vos finances ce mois-ci.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Solde consolidé"
          value={formatMoney(balance.totalCents, currency)}
          tone="primary"
          icon={<Wallet className="size-4" />}
          hint={`${balance.accountCount} compte(s)`}
        />
        <StatCard
          label="Revenus du mois"
          value={formatMoney(summary.incomeCents, currency)}
          tone="income"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Dépenses du mois"
          value={formatMoney(summary.totalExpenseCents, currency)}
          tone="expense"
          icon={<TrendingDown className="size-4" />}
          hint={`Fixes ${formatMoney(summary.fixedExpenseCents, currency)} · Variables ${formatMoney(
            summary.variableExpenseCents,
            currency,
          )}`}
        />
        <StatCard
          label="Taux d'épargne"
          value={`${summary.savingsRatePercent}%`}
          icon={<PiggyBank className="size-4" />}
          hint={`Net ${formatSignedMoney(summary.netCents, currency)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={donut} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus vs dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendBars data={trendBalance.trend} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution du solde</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceArea data={trendBalance.balance} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Budgets */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Budgets du mois</CardTitle>
            <Link href="/budgets" className="text-primary text-sm hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBudgets.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun budget défini.</p>
            ) : (
              topBudgets.map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{b.category.name}</span>
                    <span className="text-muted-foreground">
                      {formatMoney(b.spentCents, currency)} /{" "}
                      {formatMoney(b.effectiveBudgetCents, currency)}
                    </span>
                  </div>
                  <ProgressBar percent={b.percent} tone={b.state} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Savings */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Objectifs d'épargne</CardTitle>
            <Link href="/epargne" className="text-primary text-sm hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun objectif.</p>
            ) : (
              topGoals.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{g.name}</span>
                    <span className="text-muted-foreground">{g.percent}%</span>
                  </div>
                  <ProgressBar
                    percent={g.percent}
                    tone={g.currentCents >= g.targetCents ? "reached" : "ok"}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming recurring */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Prochaines échéances</CardTitle>
            <Link href="/depenses-fixes" className="text-primary text-sm hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune échéance à venir.</p>
            ) : (
              upcoming.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <CalendarClock className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm">{r.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatShortDate(r.nextRunDate)}
                  </span>
                  <span
                    className={
                      r.type === "INCOME"
                        ? "text-chart-1 text-sm font-medium"
                        : "text-destructive text-sm font-medium"
                    }
                  >
                    {r.type === "INCOME"
                      ? formatSignedMoney(r.amountCents, currency)
                      : formatSignedMoney(-r.amountCents, currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Dernières transactions</CardTitle>
            <Link href="/transactions" className="text-primary text-sm hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune transaction.</p>
            ) : (
              recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: t.category?.color ?? t.account.color }}
                  >
                    <DynamicIcon name={t.category?.icon ?? t.account.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {t.type === "TRANSFER"
                        ? `Transfert → ${t.transferAccount?.name ?? "?"}`
                        : (t.category?.name ?? t.note ?? "Sans catégorie")}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatShortDate(t.date)}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {t.type === "INCOME"
                      ? formatSignedMoney(t.amountCents, currency)
                      : t.type === "EXPENSE"
                        ? formatSignedMoney(-t.amountCents, currency)
                        : formatMoney(t.amountCents, currency)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
