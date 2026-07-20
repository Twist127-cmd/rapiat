"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { budgetInputSchema, type BudgetInput } from "@/modules/budgets/schemas";
import {
  createBudgetAction,
  updateBudgetAction,
} from "@/modules/budgets/actions/budget.actions";
import { BUDGET_PERIOD_LABELS } from "@/config/constants";
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
import type { BudgetRow } from "@/modules/budgets/types";
import type { CategoryChoice } from "@/modules/transactions";

interface Props {
  trigger: ReactNode;
  categories: CategoryChoice[];
  budget?: BudgetRow;
}

export function BudgetFormDialog({ trigger, categories, budget }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(budget);
  const expenseCategories = categories.filter((c) => c.kind === "EXPENSE");

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetInputSchema),
    defaultValues: budget
      ? {
          categoryId: budget.category.id,
          periodType: budget.periodType,
          amount: budget.amountCents / 100,
          rollover: budget.rollover,
        }
      : {
          categoryId: expenseCategories[0]?.id ?? "",
          periodType: "MONTHLY",
          amount: NaN,
          rollover: false,
        },
  });

  function onSubmit(values: BudgetInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateBudgetAction(budget!.id, values)
        : await createBudgetAction(values);
      if (result.ok) {
        toast.success(isEdit ? "Budget mis à jour." : "Budget créé.");
        setOpen(false);
        if (!isEdit) form.reset();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le budget" : "Nouveau budget"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((c) => (
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="periodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Période</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BUDGET_PERIOD_LABELS).map(([value, label]) => (
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
            <FormField
              control={form.control}
              name="rollover"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span>
                      Reporter le solde non dépensé sur la période suivante
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              {isEdit ? "Enregistrer" : "Créer le budget"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
