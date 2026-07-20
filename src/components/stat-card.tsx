import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Compact KPI tile used across the dashboard and reports. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "income" | "expense" | "primary";
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{label}</p>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </div>
        <p
          className={cn(
            "font-heading mt-1 text-2xl font-semibold",
            tone === "income" && "text-chart-1",
            tone === "expense" && "text-destructive",
            tone === "primary" && "text-primary",
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
