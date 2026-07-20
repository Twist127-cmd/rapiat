"use client";

import { useTransition } from "react";
import { Plus, MoreVertical, Pencil, Trash2, Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { FREQUENCY_LABELS } from "@/config/constants";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RecurringFormDialog } from "./RecurringFormDialog";
import {
  deleteRecurringAction,
  setRecurringActiveAction,
} from "@/modules/recurring/actions/recurring.actions";
import type { RecurringRuleRow, RecurringSummary } from "@/modules/recurring/types";
import type { AccountOption, CategoryChoice } from "@/modules/transactions";

interface Props {
  rules: RecurringRuleRow[];
  summary: RecurringSummary;
  accounts: AccountOption[];
  categories: CategoryChoice[];
  currency: string;
}

export function RecurringView({ rules, summary, accounts, categories, currency }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Dépenses fixes</h1>
          <p className="text-muted-foreground">
            Vos engagements récurrents et le reste à vivre estimé.
          </p>
        </div>
        <RecurringFormDialog
          accounts={accounts}
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" /> Nouvelle dépense fixe
            </Button>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Charges fixes / mois"
          value={formatMoney(summary.monthlyFixedExpenseCents, currency)}
          tone="expense"
        />
        <SummaryTile
          label="Revenus fixes / mois"
          value={formatMoney(summary.monthlyIncomeCents, currency)}
          tone="income"
        />
        <SummaryTile
          label="Reste à vivre"
          value={formatSignedMoney(summary.restToLiveCents, currency)}
          tone={summary.restToLiveCents < 0 ? "expense" : "net"}
        />
      </div>

      {rules.length === 0 ? (
        <EmptyState
          title="Aucune dépense fixe"
          description="Ajoutez vos abonnements, loyer, assurances ou salaire récurrents."
        />
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              accounts={accounts}
              categories={categories}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "net";
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p
          className={cn(
            "font-heading mt-1 text-2xl font-semibold",
            tone === "income" && "text-chart-1",
            tone === "expense" && "text-destructive",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RuleRow({
  rule,
  accounts,
  categories,
  currency,
}: {
  rule: RecurringRuleRow;
  accounts: AccountOption[];
  categories: CategoryChoice[];
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const r = await setRecurringActiveAction(rule.id, !rule.active);
      if (r.ok) toast.success(rule.active ? "Modèle suspendu." : "Modèle réactivé.");
      else toast.error(r.error);
    });
  }

  return (
    <Card className={cn(!rule.active && "opacity-60")}>
      <CardContent className="flex items-center gap-3 py-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: rule.category?.color ?? "#1e2a4a" }}
        >
          <DynamicIcon name={rule.category?.icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{rule.label}</p>
            {!rule.active ? (
              <Badge variant="outline" className="text-xs">
                Suspendu
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {FREQUENCY_LABELS[rule.frequency]}
            {rule.interval > 1 ? ` ×${rule.interval}` : ""} · prochaine :{" "}
            {formatShortDate(rule.nextRunDate)} · {rule.account.name}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "font-medium tabular-nums",
              rule.type === "INCOME" ? "text-chart-1" : "text-destructive",
            )}
          >
            {rule.type === "INCOME"
              ? formatSignedMoney(rule.amountCents, currency)
              : formatSignedMoney(-rule.amountCents, currency)}
          </p>
          <p className="text-muted-foreground text-xs">
            ≈ {formatMoney(rule.monthlyEquivalentCents, currency)}/mois
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <RecurringFormDialog
              accounts={accounts}
              categories={categories}
              rule={rule}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" /> Modifier
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={toggleActive}>
              {rule.active ? (
                <>
                  <Pause className="size-4" /> Suspendre
                </>
              ) : (
                <>
                  <Play className="size-4" /> Réactiver
                </>
              )}
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  <Trash2 className="size-4" /> Supprimer
                </DropdownMenuItem>
              }
              title={`Supprimer « ${rule.label} » ?`}
              description="Les transactions déjà générées sont conservées."
              destructive
              confirmLabel="Supprimer"
              onConfirm={async () => {
                const r = await deleteRecurringAction(rule.id);
                if (r.ok) toast.success("Modèle supprimé.");
                else {
                  toast.error(r.error);
                  return false;
                }
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
