"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, MoreVertical, KeyRound, ShieldCheck, ShieldOff, Trash2, Mail } from "lucide-react";

import { formatShortDate } from "@/lib/dates";
import {
  adminCreateUserSchema,
  adminResetPasswordSchema,
  type AdminCreateUserInput,
  type AdminResetPasswordInput,
} from "@/modules/superadmin/schemas";
import {
  adminCreateUserAction,
  adminResetPasswordAction,
  adminSetSuperAdminAction,
  adminDeleteUserAction,
} from "@/modules/superadmin/actions/superadmin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUserRow } from "@/modules/superadmin/types";

export function UsersManager({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">{users.length} compte(s)</p>
        </div>
        <CreateUserDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Nouvel utilisateur
            </Button>
          }
        />
      </div>

      <div className="grid gap-3">
        {users.map((u) => (
          <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function UserCard({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggleSuperAdmin() {
    startTransition(async () => {
      const r = await adminSetSuperAdminAction(user.id, !user.isSuperAdmin);
      if (r.ok) toast.success(user.isSuperAdmin ? "Rétrogradé." : "Promu super-admin.");
      else toast.error(r.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{user.name ?? "—"}</span>
            {user.isSuperAdmin ? (
              <Badge className="gap-1">
                <ShieldCheck className="size-3" /> Super-admin
              </Badge>
            ) : null}
            {isSelf ? <Badge variant="outline">Vous</Badge> : null}
          </div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
            <Mail className="size-3.5" /> <span className="truncate">{user.email}</span>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            <span>{user.accountCount} compte(s)</span>
            <span>{user.transactionCount} transaction(s)</span>
            <span>Créé le {formatShortDate(user.createdAt)}</span>
            <span>
              Dernière connexion :{" "}
              {user.lastLoginAt ? formatShortDate(user.lastLoginAt) : "jamais"}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions" disabled={isPending}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ResetPasswordDialog
              user={user}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <KeyRound className="size-4" /> Réinitialiser le mot de passe
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem onClick={toggleSuperAdmin}>
              {user.isSuperAdmin ? (
                <>
                  <ShieldOff className="size-4" /> Retirer super-admin
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Promouvoir super-admin
                </>
              )}
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                  disabled={isSelf}
                >
                  <Trash2 className="size-4" /> Supprimer le compte
                </DropdownMenuItem>
              }
              title={`Supprimer définitivement ${user.email} ?`}
              description="Toutes ses données (comptes, transactions, budgets, objectifs) seront effacées. Action irréversible."
              destructive
              confirmLabel="Supprimer définitivement"
              onConfirm={async () => {
                const r = await adminDeleteUserAction(user.id);
                if (r.ok) toast.success("Compte supprimé.");
                else {
                  toast.error(r.error);
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

function CreateUserDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AdminCreateUserInput>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: { name: "", email: "", password: "", isSuperAdmin: false },
  });

  function onSubmit(values: AdminCreateUserInput) {
    startTransition(async () => {
      const r = await adminCreateUserAction(values);
      if (r.ok) {
        toast.success("Utilisateur créé.");
        setOpen(false);
        form.reset();
      } else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe initial</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isSuperAdmin"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Donner les droits super-admin
                  </label>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              Créer
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  trigger,
}: {
  user: AdminUserRow;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: { password: "" },
  });

  function onSubmit(values: AdminResetPasswordInput) {
    startTransition(async () => {
      const r = await adminResetPasswordAction(user.id, values);
      if (r.ok) {
        toast.success(`Mot de passe de ${user.email} réinitialisé.`);
        setOpen(false);
        form.reset();
      } else toast.error(r.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground -mt-2 text-sm">
          Compte : <span className="text-foreground font-medium">{user.email}</span>. Saisissez le
          nouveau mot de passe et transmettez-le à l'utilisateur.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner /> : null}
              Réinitialiser
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
