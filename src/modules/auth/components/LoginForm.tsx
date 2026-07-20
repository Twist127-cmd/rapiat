"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

import { loginRedirectAction } from "@/modules/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "E-mail ou mot de passe incorrect.",
  invalid: "Veuillez saisir un e-mail et un mot de passe valides.",
};

function SubmitButton() {
  // Progressive enhancement: reflects the native form submission's pending
  // state when JS is available; the form still works if it isn't.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Spinner /> : null}
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export function LoginForm({
  allowSignup,
  error,
}: {
  allowSignup: boolean;
  error?: string;
}) {
  const message = error ? (ERROR_MESSAGES[error] ?? "Connexion impossible.") : null;

  return (
    <div className="grid gap-6">
      <div className="text-center lg:text-left">
        <h1 className="font-heading text-3xl font-semibold">Bon retour</h1>
        <p className="text-muted-foreground">Connectez-vous à votre espace Rapiat.</p>
      </div>

      {/* The form posts directly to a server action, so login works even
          before/without client hydration (important on mobile). */}
      <form action={loginRedirectAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="vous@exemple.ch"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {message ? (
          <p role="alert" className="text-destructive text-sm">
            {message}
          </p>
        ) : null}

        <SubmitButton />
      </form>

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
