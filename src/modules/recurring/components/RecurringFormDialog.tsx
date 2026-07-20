"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { recurringInputSchema, type RecurringInput } from "@/modules/recurring/schemas";
import {
  createRecurringAction,
  updateRecurringAction,
} from "@/modules/recurring/actions/recurring.actions";
import { FREQUENCY_LABELS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { RecurringRuleRow } from "@/modules/recurring/types";
import type { AccountOption, CategoryChoice } from "@/modules/transactions";

const NONE = "__none__";

function todayISO(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

interface Props {
  trigger: ReactNode;
  accounts: AccountOption[];
  categories: CategoryChoice[];
  rule?: RecurringRuleRow;
}

export function RecurringFormDialog({ trigger, accounts, categories, rule }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(rule);

  const form = useForm<RecurringInput>({
    resolver: zodResolver(recurringInputSchema),
    defaultValues: rule
      ? {
          label: rule.label,
          type: rule.type === "INCOME" ? "INCOME" : "EXPENSE",
          amount: rule.amountCents / 100,
          frequency: rule.frequency,
          interval: rule.interval,
          startDate: rule.nextRunDate.toISOString().slice(0, 10),
          endDate: rule.endDate ? rule.endDate.toISOString().slice(0, 10) : "",
          accountId: rule.account.id,
          categoryId: rule.category?.id ?? "",
          note: rule.note ?? "",
          expenseKind: rule.expenseKind ?? "FIXED",
          active: rule.active,
        }
      : {
          label: "",
          type: "EXPENSE",
          amount: NaN,
          frequency: "MONTHLY",
          interval: 1,
          startDate: todayISO(),
          endDate: "",
          accountId: accounts[0]?.id ?? "",
          categoryId: "",
          note: "",
          expenseKind: "FIXED",
          active: true,
        },
  });

  const type = form.watch("type");
  const eligibleCategories = categories.filter((c) =>
    type === "INCOME" ? c.kind === "INCOME" : c.kind === "EXPENSE",
  );

  function onSubmit(values: RecurringInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateRecurringAction(rule!.id, values)
        : await createRecurringAction(values);
      if (result.ok) {
        toast.success(isEdit ? "Modèle mis à jour." : "Dépense fixe créée.");
        setOpen(false);
        if (!isEdit) form.reset();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le modèle" : "Nouvelle dépense fixe"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl>
                    <Input placeholder="Loyer, Netflix, Salaire…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXPENSE">Dépense</SelectItem>
                        <SelectItem value="INCOME">Revenu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tous les</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prochaine échéance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin (optionnel)</FormLabel>
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
                  <FormLabel>Compte</FormLabel>
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
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
