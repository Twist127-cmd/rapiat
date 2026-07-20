"use client";

import { useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAccountAction } from "@/modules/settings/actions/settings.actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DangerZone() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exporter mes données</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Téléchargez l'intégralité de vos données au format JSON (portabilité RGPD).
          </p>
          <Button variant="outline" asChild>
            <a href="/api/export/data">
              <Download className="size-4" /> Télécharger (JSON)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive text-base">Supprimer mon compte</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Supprime définitivement votre compte et toutes vos données. Irréversible.
          </p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" disabled={isPending}>
                <Trash2 className="size-4" /> Supprimer mon compte
              </Button>
            }
            title="Supprimer définitivement votre compte ?"
            description="Toutes vos données (comptes, transactions, budgets, objectifs) seront effacées. Cette action est irréversible."
            destructive
            confirmLabel="Supprimer définitivement"
            onConfirm={() =>
              new Promise<boolean>((resolve) => {
                startTransition(async () => {
                  const result = await deleteAccountAction();
                  if (!result.ok) {
                    toast.error(result.error);
                    resolve(false);
                  }
                  // On success the action redirects (signOut), so this resolve
                  // may not run; guard anyway.
                  resolve(true);
                });
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
