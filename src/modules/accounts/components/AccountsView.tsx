"use client";

import { useTransition } from "react";
import { Plus, MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/money";
import { ACCOUNT_TYPE_LABELS } from "@/config/constants";
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
import { AccountFormDialog } from "./AccountFormDialog";
import {
  deleteAccountAction,
  setAccountArchivedAction,
} from "@/modules/accounts/actions/account.actions";
import type { AccountSummary, ConsolidatedBalance } from "@/modules/accounts/types";

export function AccountsView({
  accounts,
  consolidated,
}: {
  accounts: AccountSummary[];
  consolidated: ConsolidatedBalance;
}) {
  const active = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Comptes</h1>
          <p className="text-muted-foreground">Vos comptes et leur solde consolidé.</p>
        </div>
        <AccountFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Nouveau compte
            </Button>
          }
        />
      </div>

      <Card className="bg-primary text-primary-foreground border-none">
        <CardContent className="py-6">
          <p className="text-sm opacity-80">Solde consolidé</p>
          <p className="font-heading mt-1 text-4xl font-semibold">
            {formatMoney(consolidated.totalCents, consolidated.currency)}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {consolidated.accountCount} compte{consolidated.accountCount > 1 ? "s" : ""} actif
            {consolidated.accountCount > 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {active.length === 0 ? (
        <EmptyState
          title="Aucun compte"
          description="Créez votre premier compte pour commencer à suivre vos finances."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {archived.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium">Comptes archivés</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountCard({ account }: { account: AccountSummary }) {
  const [isPending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      const result = await setAccountArchivedAction(account.id, !account.archived);
      if (result.ok) toast.success(account.archived ? "Compte réactivé." : "Compte archivé.");
      else toast.error(result.error);
    });
  }

  return (
    <Card className={cn(account.archived && "opacity-60")}>
      <CardContent className="flex items-start justify-between gap-3 py-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: account.color }}
          >
            <DynamicIcon name={account.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{account.name}</p>
            <Badge variant="secondary" className="mt-0.5">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </Badge>
            <p
              className={cn(
                "font-heading mt-2 text-2xl font-semibold",
                account.currentBalanceCents < 0 && "text-destructive",
              )}
            >
              {formatMoney(account.currentBalanceCents, account.currency)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <AccountFormDialog
              account={account}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" /> Modifier
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={toggleArchive}>
              {account.archived ? (
                <>
                  <ArchiveRestore className="size-4" /> Réactiver
                </>
              ) : (
                <>
                  <Archive className="size-4" /> Archiver
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
              title="Supprimer ce compte ?"
              description="Le compte sera définitivement supprimé. Impossible s'il contient des transactions."
              destructive
              confirmLabel="Supprimer"
              onConfirm={async () => {
                const result = await deleteAccountAction(account.id);
                if (result.ok) toast.success("Compte supprimé.");
                else {
                  toast.error(result.error);
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
