import { resolveIcon } from "@/config/icons";
import { cn } from "@/lib/utils";

/** Renders a lucide icon by its kebab-case registry name (falls back to `tag`). */
export function DynamicIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = resolveIcon(name);
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
