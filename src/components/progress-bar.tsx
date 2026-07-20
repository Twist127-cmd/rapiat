import { cn } from "@/lib/utils";

/**
 * Accessible progress bar. `tone` maps to the budget traffic-light states.
 * The value is clamped to 100% for the fill; callers show the true % as text.
 */
export function ProgressBar({
  percent,
  tone = "ok",
  className,
  label,
}: {
  percent: number;
  tone?: "ok" | "warning" | "reached" | "exceeded";
  className?: string;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn("bg-muted h-2.5 w-full overflow-hidden rounded-full", className)}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "ok" && "bg-chart-1",
          tone === "warning" && "bg-chart-2",
          tone === "reached" && "bg-primary",
          tone === "exceeded" && "bg-destructive",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
