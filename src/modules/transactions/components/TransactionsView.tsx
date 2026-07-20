"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { EXPENSE_KIND_LABELS } from "@/config/constants";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TransactionFormDialog } from "./TransactionFormDialog";
import {
  deleteTransactionAction,
  duplicateTransactionAction,
  bulkDeleteTransactionsAction,
} from "@/modules/transactions/actions/transaction.actions";
import type { TransactionListResult, TransactionRow } from "@/modules/transactions/types";
import type { AccountOption, CategoryChoice } from "./types";

const ALL = "__all__";

interface Props {
  data: TransactionListResult;
  accounts: (AccountOption & { color: string; icon: string })[];
  categories: CategoryChoice[];
  currency: string;
  filters: Record<string, string | undefined>;
}

export function TransactionsView({ data, accounts, categories, currency, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      router.push(`/transactions?${params.toString()}`);
    },
    [router, searchParams],
  );

  const onSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setParam("text", value), 300);
    },
    [setParam],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === data.rows.length ? new Set() : new Set(data.rows.map((r) => r.id)),
    );
  }

  function bulkDelete() {
    startTransition(async () => {
      const result = await bulkDeleteTransactionsAction(Array.from(selected));
      if (result.ok) {
        toast.success(`${result.data.count} transaction(s) supprimée(s).`);
        setSelected(new Set());
      } else toast.error(result.error);
    });
  }

  const catChoices: CategoryChoice[] = categories;
  const netCents = data.totalIncomeCents - data.totalExpenseCents;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground">
            {data.totalCount} transaction{data.totalCount > 1 ? "s" : ""} sur la période
          </p>
        </div>
        <TransactionFormDialog
          accounts={accounts}
          categories={catChoices}
          trigger={
            <Button>
              <Plus className="size-4" /> Ajouter
            </Button>
          }
        />
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-3 gap-3">
        <TotalTile label="Revenus" cents={data.totalIncomeCents} currency={currency} tone="income" />
        <TotalTile
          label="Dépenses"
          cents={data.totalExpenseCents}
          currency={currency}
          tone="expense"
        />
        <TotalTile label="Net" cents={netCents} currency={currency} tone="net" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              defaultValue={filters.text ?? ""}
              placeholder="Rechercher…"
              className="pl-8"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <FilterSelect
            value={filters.type ?? ALL}
            onChange={(v) => setParam("type", v)}
            placeholder="Type"
            options={[
              { value: "INCOME", label: "Revenus" },
              { value: "EXPENSE", label: "Dépenses" },
              { value: "TRANSFER", label: "Transferts" },
            ]}
          />
          <FilterSelect
            value={filters.accountId ?? ALL}
            onChange={(v) => setParam("accountId", v)}
            placeholder="Compte"
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
          <FilterSelect
            value={filters.categoryId ?? ALL}
            onChange={(v) => setParam("categoryId", v)}
            placeholder="Catégorie"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <Input
              type="date"
              aria-label="Du"
              defaultValue={filters.from ?? ""}
              onChange={(e) => setParam("from", e.target.value)}
            />
            <Input
              type="date"
              aria-label="Au"
              defaultValue={filters.to ?? ""}
              onChange={(e) => setParam("to", e.target.value)}
            />
          </div>
          <FilterSelect
            value={filters.expenseKind ?? ALL}
            onChange={(v) => setParam("expenseKind", v)}
            placeholder="Nature"
            options={[
              { value: "FIXED", label: "Fixe" },
              { value: "VARIABLE", label: "Variable" },
            ]}
          />
          <Button variant="ghost" onClick={() => router.push("/transactions")}>
            <X className="size-4" /> Réinitialiser
          </Button>
        </CardContent>
      </Card>

      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div className="bg-accent flex items-center justify-between rounded-lg px-4 py-2">
          <span className="text-sm font-medium">{selected.size} sélectionnée(s)</span>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" /> Supprimer
              </Button>
            }
            title="Supprimer les transactions sélectionnées ?"
            destructive
            confirmLabel="Supprimer"
            onConfirm={bulkDelete}
          />
        </div>
      ) : null}

      {/* Table */}
      {data.rows.length === 0 ? (
        <EmptyState
          title="Aucune transaction"
          description="Ajoutez votre première transaction ou ajustez les filtres."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="w-10 p-3">
                      <input
                        type="checkbox"
                        aria-label="Tout sélectionner"
                        checked={selected.size === data.rows.length && data.rows.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="p-3 font-medium">Transaction</th>
                    <th className="hidden p-3 font-medium sm:table-cell">Date</th>
                    <th className="hidden p-3 font-medium md:table-cell">Compte</th>
                    <th className="p-3 text-right font-medium">Montant</th>
                    <th className="w-10 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <TransactionTableRow
                      key={row.id}
                      row={row}
                      currency={currency}
                      accounts={accounts}
                      categories={catChoices}
                      selected={selected.has(row.id)}
                      onToggle={() => toggle(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TotalTile({
  label,
  cents,
  currency,
  tone,
}: {
  label: string;
  cents: number;
  currency: string;
  tone: "income" | "expense" | "net";
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={cn(
            "font-heading mt-1 text-lg font-semibold sm:text-2xl",
            tone === "income" && "text-chart-1",
            tone === "expense" && "text-destructive",
            tone === "net" && cents < 0 && "text-destructive",
          )}
        >
          {tone === "net"
            ? formatSignedMoney(cents, currency)
            : formatMoney(cents, currency)}
        </p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder} : tous</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TransactionTableRow({
  row,
  currency,
  accounts,
  categories,
  selected,
  onToggle,
}: {
  row: TransactionRow;
  currency: string;
  accounts: (AccountOption & { color: string; icon: string })[];
  categories: CategoryChoice[];
  selected: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const signedCents =
    row.type === "INCOME" ? row.amountCents : row.type === "EXPENSE" ? -row.amountCents : 0;

  const TypeIcon =
    row.type === "INCOME" ? ArrowDownLeft : row.type === "EXPENSE" ? ArrowUpRight : ArrowLeftRight;

  const title =
    row.type === "TRANSFER"
      ? `Transfert → ${row.transferAccount?.name ?? "?"}`
      : (row.category?.name ?? row.note ?? "Sans catégorie");

  return (
    <tr className="hover:bg-muted/50 border-b last:border-0">
      <td className="p-3">
        <input
          type="checkbox"
          aria-label="Sélectionner"
          checked={selected}
          onChange={onToggle}
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: row.category?.color ?? row.account.color }}
          >
            {row.category ? (
              <DynamicIcon name={row.category.icon} className="size-4" />
            ) : (
              <TypeIcon className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{title}</p>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {row.note && row.type !== "TRANSFER" ? (
                <span className="truncate">{row.note}</span>
              ) : null}
              {row.expenseKind ? (
                <Badge variant="outline" className="px-1 py-0 text-[10px]">
                  {EXPENSE_KIND_LABELS[row.expenseKind]}
                </Badge>
              ) : null}
              {row.tags.slice(0, 2).map((t) => (
                <Badge key={t} variant="secondary" className="px-1 py-0 text-[10px]">
                  #{t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </td>
      <td className="text-muted-foreground hidden p-3 sm:table-cell">
        {formatShortDate(row.date)}
      </td>
      <td className="text-muted-foreground hidden p-3 md:table-cell">{row.account.name}</td>
      <td
        className={cn(
          "p-3 text-right font-medium tabular-nums",
          row.type === "INCOME" && "text-chart-1",
          row.type === "EXPENSE" && "text-destructive",
        )}
      >
        {row.type === "TRANSFER"
          ? formatMoney(row.amountCents, currency)
          : formatSignedMoney(signedCents, currency)}
      </td>
      <td className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <TransactionFormDialog
              accounts={accounts}
              categories={categories}
              transaction={row}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" /> Modifier
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem
              onClick={() =>
                startTransition(async () => {
                  const r = await duplicateTransactionAction(row.id);
                  if (r.ok) toast.success("Transaction dupliquée.");
                  else toast.error(r.error);
                })
              }
            >
              <Copy className="size-4" /> Dupliquer
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
              title="Supprimer cette transaction ?"
              destructive
              confirmLabel="Supprimer"
              onConfirm={async () => {
                const r = await deleteTransactionAction(row.id);
                if (r.ok) toast.success("Transaction supprimée.");
                else {
                  toast.error(r.error);
                  return false;
                }
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
