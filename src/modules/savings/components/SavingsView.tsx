"use client";

import { useState, useTransition } from "react";
import { Plus, MoreVertical, Pencil, Trash2, PiggyBank, Target } from "lucide-react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { ProgressBar } from "@/components/progress-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SavingsGoalFormDialog } from "./SavingsGoalFormDialog";
import {
  contributeAction,
  deleteSavingsGoalAction,
} from "@/modules/savings/actions/savings.actions";
import type { SavingsGoalRow, SavingsSummary } from "@/modules/savings/types";
import type { AccountOption } from "@/modules/transactions";

interface Props {
  goals: SavingsGoalRow[];
  summary: SavingsSummary;
  accounts: AccountOption[];
  currency: string;
  savingsRatePercent: number;
}

export function SavingsView({ goals, summary, accounts, currency, savingsRatePercent }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Épargne</h1>
          <p className="text-muted-foreground">Vos objectifs et votre progression.</p>
        </div>
        <SavingsGoalFormDialog
          accounts={accounts}
          trigger={
            <Button>
              <Plus className="size-4" /> Nouvel objectif
            </Button>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total épargné" value={formatMoney(summary.totalSavedCents, currency)} />
        <StatTile label="Total visé" value={formatMoney(summary.totalTargetCents, currency)} />
        <StatTile label="Taux d'épargne (mois)" value={`${savingsRatePercent}%`} />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="Aucun objectif"
          description="Créez un objectif (vacances, fonds d'urgence…) et suivez sa progression."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} accounts={accounts} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="font-heading mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function GoalCard({
  goal,
  accounts,
  currency,
}: {
  goal: SavingsGoalRow;
  accounts: AccountOption[];
  currency: string;
}) {
  const reached = goal.currentCents >= goal.targetCents;
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: goal.color }}
          >
            {reached ? <Target className="size-4" /> : <PiggyBank className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{goal.name}</p>
            <p className="text-muted-foreground text-xs">
              {goal.deadline ? `Échéance : ${formatShortDate(goal.deadline)}` : "Sans échéance"}
              {goal.accountName ? ` · ${goal.accountName}` : ""}
            </p>
          </div>
          <ContributeDialog goal={goal} currency={currency} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SavingsGoalFormDialog
                accounts={accounts}
                goal={goal}
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
                title={`Supprimer « ${goal.name} » ?`}
                destructive
                confirmLabel="Supprimer"
                onConfirm={async () => {
                  const r = await deleteSavingsGoalAction(goal.id);
                  if (r.ok) toast.success("Objectif supprimé.");
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
          percent={goal.percent}
          tone={reached ? "reached" : "ok"}
          label={`${goal.name} : ${goal.percent}%`}
        />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatMoney(goal.currentCents, currency)} / {formatMoney(goal.targetCents, currency)}
          </span>
          <span className="font-medium">{goal.percent}%</span>
        </div>
        {goal.monthlyNeededCents && !reached ? (
          <p className="text-muted-foreground text-xs">
            À épargner : {formatMoney(goal.monthlyNeededCents, currency)}/mois pour tenir l'échéance.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ContributeDialog({ goal, currency }: { goal: SavingsGoalRow; currency: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value === 0) {
      toast.error("Montant invalide.");
      return;
    }
    startTransition(async () => {
      const r = await contributeAction(goal.id, { amount: value });
      if (r.ok) {
        toast.success("Contribution enregistrée.");
        setOpen(false);
        setAmount("");
      } else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribuer à « {goal.name} »</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label htmlFor={`contrib-${goal.id}`} className="text-sm">
            Montant ({currency}) — négatif pour retirer
          </label>
          <Input
            id={`contrib-${goal.id}`}
            type="number"
            step="0.01"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending} className="w-full sm:w-auto">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
