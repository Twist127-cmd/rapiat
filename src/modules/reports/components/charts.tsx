"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import { formatMoney } from "@/lib/money";
import type { BalancePoint, CategoryDatum, TrendDatum } from "@/modules/reports/types";

const AXIS_PROPS = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

function moneyTick(currency: string) {
  return (value: number) => formatMoney(value, currency).replace(/[  ]/g, " ");
}

/** Donut of expenses by category. */
export function CategoryDonut({
  data,
  currency,
}: {
  data: CategoryDatum[];
  currency: string;
}) {
  if (data.length === 0) {
    return <EmptyChart message="Aucune dépense sur la période." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amountCents"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          stroke="var(--card)"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatMoney(value, currency)}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Grouped bars: income vs expense per month. */
export function TrendBars({ data, currency }: { data: TrendDatum[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={70} tickFormatter={moneyTick(currency)} />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value: number) => formatMoney(value, currency)}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Legend formatter={(v) => <span style={{ color: "var(--foreground)" }}>{v}</span>} />
        <Bar dataKey="incomeCents" name="Revenus" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenseCents" name="Dépenses" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Net-worth balance evolution over the months. */
export function BalanceArea({
  data,
  currency,
}: {
  data: BalancePoint[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={70} tickFormatter={moneyTick(currency)} />
        <Tooltip
          formatter={(value: number) => formatMoney(value, currency)}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="balanceCents"
          name="Solde"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#balanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
      {message}
    </div>
  );
}
