"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { savingsGoalInputSchema, type SavingsGoalInput } from "@/modules/savings/schemas";
import {
  createSavingsGoalAction,
  updateSavingsGoalAction,
} from "@/modules/savings/actions/savings.actions";
import { ColorPicker } from "@/components/pickers";
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
import type { SavingsGoalRow } from "@/modules/savings/types";
import type { AccountOption } from "@/modules/transactions";

const NONE = "__none__";

interface Props {
  trigger: ReactNode;
  accounts: AccountOption[];
  goal?: SavingsGoalRow;
}

export function SavingsGoalFormDialog({ trigger, accounts, goal }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(goal);

  const form = useForm<SavingsGoalInput>({
    resolver: zodResolver(savingsGoalInputSchema),
    defaultValues: goal
      ? {
          name: goal.name,
          target: goal.targetCents / 100,
          current: goal.currentCents / 100,
          deadline: goal.deadline ? goal.deadline.toISOString().slice(0, 10) : "",
          accountId: goal.accountId ?? "",
          color: goal.color,
        }
      : { name: "", target: NaN, current: 0, deadline: "", accountId: "", color: "#e6a4b4" },
  });

  function onSubmit(values: SavingsGoalInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateSavingsGoalAction(goal!.id, values)
        : await createSavingsGoalAction(values);
      if (result.ok) {
        toast.success(isEdit ? "Objectif mis à jour." : "Objectif créé.");
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
          <DialogTitle>{isEdit ? "Modifier l'objectif" : "Nouvel objectif d'épargne"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Vacances, Fonds d'urgence…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant cible</FormLabel>
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
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Déjà épargné</FormLabel>
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
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Échéance (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte associé (optionnel)</FormLabel>
                  <Select
                    value={field.value ? field.value : NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Aucun</SelectItem>
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              {isEdit ? "Enregistrer" : "Créer l'objectif"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
