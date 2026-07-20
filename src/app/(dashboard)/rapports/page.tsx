import type { Metadata } from "next";
import { FileText, Sheet, ArrowUp, ArrowDown, Minus } from "lucide-react";

import { getUserContext } from "@/server/data-access";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatMonthLabel } from "@/lib/dates";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrendAndBalance,
  comparePeriods,
  CategoryDonut,
  TrendBars,
  BalanceArea,
  MonthNav,
} from "@/modules/reports";

export const metadata: Metadata = {
  title: "Rapports",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Parse "YYYY-MM" to the first day of that month; defaults to the current month. */
function parseMonth(value: string | undefined): { date: Date; param: string } {
  const now = new Date();
  const m = value && /^\d{4}-\d{2}$/.test(value) ? value : null;
  const date = m
    ? new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const param = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return { date, param };
}

function DeltaBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Minus className="size-3" /> n/a
      </span>
    );
  }
  const up = percent > 0;
  const down = percent < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        up ? "text-chart-1" : down ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {up ? <ArrowUp className="size-3" /> : down ? <ArrowDown className="size-3" /> : null}
      {Math.abs(percent)}% vs mois précédent
    </span>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const monthParam = Array.isArray(sp.month) ? sp.month[0] : sp.month;
  const { date, param } = parseMonth(monthParam);
  const ctx = await getUserContext();

  const [summary, comparison, donut, trendBalance] = await Promise.all([
    getMonthlySummary(ctx, date),
    comparePeriods(ctx, date),
    getCategoryBreakdown(ctx, date),
    getTrendAndBalance(ctx, 6),
  ]);

  const currency = ctx.currency;
  const totalDonut = donut.reduce((s, d) => s + d.amountCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Rapports</h1>
          <p className="text-muted-foreground">Analyses et exports de vos finances.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNav month={param} label={formatMonthLabel(date)} />
          <Button variant="outline" asChild>
            <a href={`/api/export/pdf?month=${param}`}>
              <FileText className="size-4" /> PDF
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/export/excel?month=${param}`}>
              <Sheet className="size-4" /> Excel
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenus"
          value={formatMoney(summary.incomeCents, currency)}
          tone="income"
          hint={<DeltaBadge percent={comparison.incomeDeltaPercent} />}
        />
        <StatCard
          label="Dépenses"
          value={formatMoney(summary.totalExpenseCents, currency)}
          tone="expense"
          hint={<DeltaBadge percent={comparison.expenseDeltaPercent} />}
        />
        <StatCard
          label="Solde net"
          value={formatSignedMoney(summary.netCents, currency)}
          tone="primary"
        />
        <StatCard label="Taux d'épargne" value={`${summary.savingsRatePercent}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={donut} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {donut.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune dépense ce mois-ci.</p>
            ) : (
              <ul className="space-y-2">
                {donut.map((d) => {
                  const pct = totalDonut > 0 ? Math.round((d.amountCents / totalDonut) * 100) : 0;
                  return (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                      <span className="w-24 text-right font-medium tabular-nums">
                        {formatMoney(d.amountCents, currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus vs dépenses (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendBars data={trendBalance.trend} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution du solde</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceArea data={trendBalance.balance} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
