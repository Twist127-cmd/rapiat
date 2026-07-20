"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

import { signupRedirectAction } from "@/modules/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const ERROR_MESSAGES: Record<string, string> = {
  email: "Un compte existe déjà avec cette adresse e-mail.",
  invalid:
    "Vérifiez vos informations : mot de passe d'au moins 8 caractères et confirmation identique.",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Spinner /> : null}
      {pending ? "Création…" : "Créer mon compte"}
    </Button>
  );
}

export function SignupForm({ error }: { error?: string }) {
  const message = error ? (ERROR_MESSAGES[error] ?? "Inscription impossible.") : null;

  return (
    <div className="grid gap-6">
      <div className="text-center lg:text-left">
        <h1 className="font-heading text-3xl font-semibold">Créer un compte</h1>
        <p className="text-muted-foreground">Commencez à suivre vos finances en un instant.</p>
      </div>

      <form action={signupRedirectAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Marie Exemple" required />
        </div>
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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
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

      <p className="text-muted-foreground text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
