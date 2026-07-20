"use client";

import { Plus, MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/money";
import { BUDGET_PERIOD_LABELS } from "@/config/constants";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ProgressBar } from "@/components/progress-bar";
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
import { BudgetFormDialog } from "./BudgetFormDialog";
import { deleteBudgetAction } from "@/modules/budgets/actions/budget.actions";
import type { BudgetRow, BudgetsSummary } from "@/modules/budgets/types";
import type { CategoryChoice } from "@/modules/transactions";

interface Props {
  budgets: BudgetRow[];
  summary: BudgetsSummary;
  categories: CategoryChoice[];
  currency: string;
}

const STATE_LABEL: Record<BudgetRow["state"], string> = {
  ok: "Dans les clous",
  warning: "Proche",
  reached: "Atteint",
  exceeded: "Dépassé",
};

export function BudgetsView({ budgets, summary, categories, currency }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Budgets</h1>
          <p className="text-muted-foreground capitalize">{summary.periodLabel}</p>
        </div>
        <BudgetFormDialog
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" /> Nouveau budget
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">Budget total</p>
            <p className="font-heading text-2xl font-semibold">
              {formatMoney(summary.totalBudgetCents, currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Dépensé</p>
            <p className="font-heading text-2xl font-semibold">
              {formatMoney(summary.totalSpentCents, currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Restant</p>
            <p
              className={cn(
                "font-heading text-2xl font-semibold",
                summary.totalRemainingCents < 0 && "text-destructive",
              )}
            >
              {formatMoney(summary.totalRemainingCents, currency)}
            </p>
          </div>
        </CardContent>
      </Card>

      {budgets.length === 0 ? (
        <EmptyState
          title="Aucun budget"
          description="Fixez un budget mensuel par catégorie pour suivre vos dépenses façon enveloppes."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categories={categories}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetCard({
  budget,
  categories,
  currency,
}: {
  budget: BudgetRow;
  categories: CategoryChoice[];
  currency: string;
}) {
  const overspent = budget.remainingCents < 0;
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: budget.category.color }}
          >
            <DynamicIcon name={budget.category.icon} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{budget.category.name}</p>
            <p className="text-muted-foreground text-xs">
              {BUDGET_PERIOD_LABELS[budget.periodType]}
              {budget.rollover ? " · report activé" : ""}
            </p>
          </div>
          <Badge
            variant={
              budget.state === "exceeded"
                ? "destructive"
                : budget.state === "warning"
                  ? "secondary"
                  : "outline"
            }
          >
            {budget.state === "exceeded" ? (
              <AlertTriangle className="size-3" />
            ) : null}
            {STATE_LABEL[budget.state]}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <BudgetFormDialog
                categories={categories}
                budget={budget}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="size-4" /> Modifier
                  </DropdownMenuItem>
                }
              />
              <ConfirmDialog
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" /> Supprimer
                  </DropdownMenuItem>
                }
                title="Supprimer ce budget ?"
                destructive
                confirmLabel="Supprimer"
                onConfirm={async () => {
                  const r = await deleteBudgetAction(budget.id);
                  if (r.ok) toast.success("Budget supprimé.");
                  else {
                    toast.error(r.error);
                    return false;
                  }
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ProgressBar
          percent={budget.percent}
          tone={budget.state}
          label={`${budget.category.name} : ${budget.percent}%`}
        />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatMoney(budget.spentCents, currency)} /{" "}
            {formatMoney(budget.effectiveBudgetCents, currency)}
          </span>
          <span className={cn("font-medium", overspent && "text-destructive")}>
            {overspent
              ? `${formatMoney(-budget.remainingCents, currency)} de trop`
              : `${formatMoney(budget.remainingCents, currency)} restant`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
