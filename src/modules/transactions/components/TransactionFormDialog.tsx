"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { transactionInputSchema, type TransactionInput } from "@/modules/transactions/schemas";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/modules/transactions/actions/transaction.actions";
import { parseTagsInput, tagsToInput } from "@/modules/transactions/domain/transaction.rules";
import { TRANSACTION_TYPE_LABELS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TransactionRow } from "@/modules/transactions/types";
import type { AccountOption, CategoryChoice } from "./types";

const NONE = "__none__";

function todayISO(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

interface Props {
  /** Optional trigger. Omit when driving the dialog with `open`/`onOpenChange`. */
  trigger?: ReactNode;
  accounts: AccountOption[];
  categories: CategoryChoice[];
  transaction?: TransactionRow;
  /** Controlled open state (e.g. opened from a swipeable card's tap). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionFormDialog({
  trigger,
  accounts,
  categories,
  transaction,
  open: openProp,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [isPending, startTransition] = useTransition();
  const [tagsText, setTagsText] = useState(transaction ? tagsToInput(transaction.tags) : "");
  const isEdit = Boolean(transaction);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: transaction.amountCents / 100,
          date: transaction.date.toISOString().slice(0, 10),
          accountId: transaction.account.id,
          categoryId: transaction.category?.id ?? "",
          transferAccountId: transaction.transferAccount?.id ?? "",
          note: transaction.note ?? "",
          expenseKind: transaction.expenseKind ?? undefined,
        }
      : {
          type: "EXPENSE",
          amount: NaN,
          date: todayISO(),
          accountId: accounts[0]?.id ?? "",
          categoryId: "",
          transferAccountId: "",
          note: "",
          expenseKind: "VARIABLE",
        },
  });

  const type = form.watch("type");
  const accountId = form.watch("accountId");
  const eligibleCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE",
  );

  function onSubmit(values: TransactionInput) {
    const payload: TransactionInput = { ...values, tags: parseTagsInput(tagsText) };
    startTransition(async () => {
      const result = isEdit
        ? await updateTransactionAction(transaction!.id, payload)
        : await createTransactionAction(payload);
      if (result.ok) {
        toast.success(isEdit ? "Transaction mise à jour." : "Transaction enregistrée.");
        setOpen(false);
        if (!isEdit) {
          form.reset({ ...form.getValues(), amount: NaN, note: "" });
          setTagsText("");
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[92svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            {/* Type segmented control */}
            <div className="bg-muted grid grid-cols-3 gap-1 rounded-lg p-1" role="tablist">
              {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={type === t}
                  onClick={() => form.setValue("type", t)}
                  className={cn(
                    "rounded-md py-1.5 text-sm font-medium transition-colors",
                    type === t ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {TRANSACTION_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        autoFocus
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? NaN : e.target.valueAsNumber)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "TRANSFER" ? "Compte source" : "Compte"}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un compte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "TRANSFER" ? (
              <FormField
                control={form.control}
                name="transferAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte de destination</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un compte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter((a) => a.id !== accountId)
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select
                      value={field.value ? field.value : NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Aucune</SelectItem>
                        {eligibleCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "EXPENSE" ? (
              <FormField
                control={form.control}
                name="expenseKind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature de la dépense</FormLabel>
                    <Select value={field.value ?? "VARIABLE"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VARIABLE">Variable (ponctuelle)</SelectItem>
                        <SelectItem value="FIXED">Fixe (récurrente)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optionnel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <Label htmlFor="tx-tags">Tags</Label>
              <Input
                id="tx-tags"
                placeholder="vacances, courses (séparés par des virgules)"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
