"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Previous/next month navigation; updates the `?month=YYYY-MM` query param. */
export function MonthNav({ month, label }: { month: string; label: string }) {
  const router = useRouter();

  function shift(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y!, (m ?? 1) - 1 + delta, 1);
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/rapports?month=${next}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Mois précédent" onClick={() => shift(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="font-heading min-w-40 text-center text-lg font-semibold capitalize">
        {label}
      </span>
      <Button variant="outline" size="icon" aria-label="Mois suivant" onClick={() => shift(1)}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
