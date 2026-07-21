"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createTransactionAction } from "@/modules/transactions/actions/transaction.actions";
import { TRANSACTION_TYPE_LABELS } from "@/config/constants";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface QuickAccount {
  id: string;
  name: string;
}
export interface QuickCategory {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";

function todayISO(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/**
 * Thumb-friendly quick transaction entry (mobile bottom sheet / desktop modal).
 * Controlled via `open`/`onOpenChange`. Reuses the existing server action — UI
 * only. Big amount field, type toggle, and horizontally-scrollable chips for
 * category/account keep the whole flow to a few taps.
 */
export function QuickTransactionSheet({
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: QuickAccount[];
  categories: QuickCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [transferAccountId, setTransferAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const eligibleCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE",
  );

  function reset() {
    setAmount("");
    setCategoryId("");
    setNote("");
    setTransferAccountId("");
    setType("EXPENSE");
    setDate(todayISO());
    setError(null);
  }

  function submit() {
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Saisissez un montant valide.");
      return;
    }
    const payload = {
      type,
      amount: value,
      date,
      accountId,
      categoryId: type === "TRANSFER" ? "" : categoryId,
      transferAccountId: type === "TRANSFER" ? transferAccountId : "",
      note,
      tags: [] as string[],
      expenseKind: type === "EXPENSE" ? ("VARIABLE" as const) : undefined,
    };
    startTransition(async () => {
      const result = await createTransactionAction(payload);
      if (result.ok) {
        toast.success("Transaction enregistrée.");
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nouvelle transaction</SheetTitle>
        </SheetHeader>

        <div className="grid gap-5 py-1">
          {/* Type toggle */}
          <div className="bg-muted grid grid-cols-3 gap-1 rounded-xl p-1" role="tablist">
            {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={type === t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors",
                  type === t ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                {TRANSACTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Amount — large, numeric */}
          <div className="grid gap-1.5">
            <label htmlFor="qt-amount" className="text-muted-foreground text-sm">
              Montant
            </label>
            <input
              id="qt-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring h-16 rounded-xl border text-center font-heading text-4xl font-semibold tabular-nums outline-none focus-visible:ring-2"
            />
          </div>

          {/* Account chips */}
          <ChipGroup label={type === "TRANSFER" ? "Compte source" : "Compte"}>
            {accounts.map((a) => (
              <Chip key={a.id} active={accountId === a.id} onClick={() => setAccountId(a.id)}>
                {a.name}
              </Chip>
            ))}
          </ChipGroup>

          {type === "TRANSFER" ? (
            <ChipGroup label="Vers le compte">
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <Chip
                    key={a.id}
                    active={transferAccountId === a.id}
                    onClick={() => setTransferAccountId(a.id)}
                  >
                    {a.name}
                  </Chip>
                ))}
            </ChipGroup>
          ) : (
            <ChipGroup label="Catégorie">
              {eligibleCategories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  color={c.color}
                  icon={c.icon}
                >
                  {c.name}
                </Chip>
              ))}
            </ChipGroup>
          )}

          {/* Date + note */}
          <div className="grid gap-1.5">
            <label htmlFor="qt-date" className="text-muted-foreground text-sm">
              Date
            </label>
            <Input
              id="qt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="qt-note" className="text-muted-foreground text-sm">
              Note (optionnel)
            </label>
            <Input
              id="qt-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex. Courses"
              className="h-11"
            />
          </div>

          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter>
          <Button onClick={submit} disabled={isPending} className="h-12 w-full text-base">
            {isPending ? <Spinner /> : null}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {icon ? (
        <span
          className="flex size-5 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: active ? "transparent" : color }}
        >
          <DynamicIcon name={icon} className="size-3.5" />
        </span>
      ) : null}
      {children}
    </button>
  );
}
