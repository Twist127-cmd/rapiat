"use client";

import { useState, useTransition } from "react";
import {
  Copy,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

import { formatMoney, formatSignedMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { EXPENSE_KIND_LABELS } from "@/config/constants";
import { DynamicIcon } from "@/components/dynamic-icon";
import { SwipeableRow } from "@/components/swipeable-row";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TransactionFormDialog } from "./TransactionFormDialog";
import {
  deleteTransactionAction,
  duplicateTransactionAction,
} from "@/modules/transactions/actions/transaction.actions";
import type { TransactionRow } from "@/modules/transactions/types";
import type { AccountOption, CategoryChoice } from "./types";

export function TransactionCard({
  row,
  currency,
  accounts,
  categories,
}: {
  row: TransactionRow;
  currency: string;
  accounts: AccountOption[];
  categories: CategoryChoice[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  const signedCents =
    row.type === "INCOME" ? row.amountCents : row.type === "EXPENSE" ? -row.amountCents : 0;
  const TypeIcon =
    row.type === "INCOME" ? ArrowDownLeft : row.type === "EXPENSE" ? ArrowUpRight : ArrowLeftRight;
  const title =
    row.type === "TRANSFER"
      ? `Transfert → ${row.transferAccount?.name ?? "?"}`
      : (row.category?.name ?? row.note ?? "Sans catégorie");

  return (
    <>
      <SwipeableRow
        className="border"
        onTap={() => setEditOpen(true)}
        actions={[
          {
            label: "Dupliquer",
            icon: <Copy className="size-4" />,
            onClick: () =>
              startTransition(async () => {
                const r = await duplicateTransactionAction(row.id);
                if (r.ok) toast.success("Transaction dupliquée.");
                else toast.error(r.error);
              }),
          },
          {
            label: "Supprimer",
            icon: <Trash2 className="size-4" />,
            destructive: true,
            onClick: () =>
              startTransition(async () => {
                const r = await deleteTransactionAction(row.id);
                if (r.ok) toast.success("Transaction supprimée.");
                else toast.error(r.error);
              }),
          },
        ]}
      >
        <div className="flex items-center gap-3 p-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: row.category?.color ?? row.account.color }}
          >
            {row.category ? (
              <DynamicIcon name={row.category.icon} className="size-5" />
            ) : (
              <TypeIcon className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{title}</p>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span>{formatShortDate(row.date)}</span>
              <span>·</span>
              <span className="truncate">{row.account.name}</span>
              {row.expenseKind ? (
                <Badge variant="outline" className="px-1 py-0 text-[10px]">
                  {EXPENSE_KIND_LABELS[row.expenseKind]}
                </Badge>
              ) : null}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 font-medium tabular-nums",
              row.type === "INCOME" && "text-chart-1",
              row.type === "EXPENSE" && "text-destructive",
            )}
          >
            {row.type === "TRANSFER"
              ? formatMoney(row.amountCents, currency)
              : formatSignedMoney(signedCents, currency)}
          </span>
        </div>
      </SwipeableRow>

      {/* Tap opens the editor (also serves as the detail view). */}
      <TransactionFormDialog
        accounts={accounts}
        categories={categories}
        transaction={row}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
