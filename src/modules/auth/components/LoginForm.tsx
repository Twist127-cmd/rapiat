"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema, type LoginInput } from "@/modules/auth/schemas";
import { loginAction } from "@/modules/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm({ allowSignup }: { allowSignup: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        // Full-page navigation (not client-side router.push): guarantees the
        // freshly set session cookie is sent on the next request. Fixes a
        // mobile-Safari case where a soft navigation bounced back to /login.
        window.location.assign("/");
        return;
      }
      setFormError(result.error);
      toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-6">
      <div className="text-center lg:text-left">
        <h1 className="font-heading text-3xl font-semibold">Bon retour</h1>
        <p className="text-muted-foreground">Connectez-vous à votre espace Rapiat.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse e-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.ch"
                    {...field}
                  />
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
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </Form>
      {allowSignup ? (
        <p className="text-muted-foreground text-center text-sm">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      ) : null}
    </div>
  );
}
