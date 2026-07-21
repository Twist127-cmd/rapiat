"use client";

import { useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminAuditResult } from "@/modules/superadmin/types";

const ALL = "__all__";
const PAGE = 100;

function fmt(d: Date): string {
  // Full timestamp for the log (locale-independent, stable).
  return new Date(d).toLocaleString("fr-CH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function actionTone(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.startsWith("superadmin.")) return "default";
  if (action.includes("delete")) return "destructive";
  if (action === "login" || action === "signup") return "secondary";
  return "outline";
}

export function AuditLogView({
  result,
  actions,
  filters,
  page,
}: {
  result: AdminAuditResult;
  actions: string[];
  filters: Record<string, string | undefined>;
  page: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      if (resetPage) params.delete("page");
      router.push(`/superadmin/journaux?${params.toString()}`);
    },
    [router, searchParams],
  );

  const onSearch = useCallback(
    (v: string) => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => setParam("text", v), 300);
    },
    [setParam],
  );

  const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Journaux d'activité</h1>
        <p className="text-muted-foreground text-sm">
          {result.totalCount} événement(s) — page {page + 1}/{totalPages}
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              defaultValue={filters.text ?? ""}
              placeholder="Rechercher (e-mail, détail, action)…"
              className="pl-8"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <Select value={filters.action ?? ALL} onValueChange={(v) => setParam("action", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              aria-label="Du"
              defaultValue={filters.from ?? ""}
              onChange={(e) => setParam("from", e.target.value)}
            />
            <Input
              type="date"
              aria-label="Au"
              defaultValue={filters.to ?? ""}
              onChange={(e) => setParam("to", e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            className="lg:col-span-4 lg:justify-self-start"
            onClick={() => router.push("/superadmin/journaux")}
          >
            <X className="size-4" /> Réinitialiser les filtres
          </Button>
        </CardContent>
      </Card>

      {result.rows.length === 0 ? (
        <EmptyState title="Aucun événement" description="Aucun log ne correspond à ces filtres." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="p-3 font-medium whitespace-nowrap">Date &amp; heure</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Utilisateur</th>
                    <th className="p-3 font-medium">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50 border-b last:border-0 align-top">
                      <td className="text-muted-foreground p-3 whitespace-nowrap tabular-nums">
                        {fmt(r.createdAt)}
                      </td>
                      <td className="p-3">
                        <Badge variant={actionTone(r.action)} className="font-mono text-[11px]">
                          {r.action}
                        </Badge>
                      </td>
                      <td className="p-3">{r.userEmail ?? "—"}</td>
                      <td className="text-muted-foreground p-3">{r.detail ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 0}
            onClick={() => setParam("page", String(page - 1), false)}
          >
            Précédent
          </Button>
          <span className="text-muted-foreground text-sm">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setParam("page", String(page + 1), false)}
          >
            Suivant
          </Button>
        </div>
      ) : null}
    </div>
  );
}
