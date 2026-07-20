import { createElement } from "react";

import { resolveIcon } from "@/config/icons";
import { cn } from "@/lib/utils";

/**
 * Renders a lucide icon by its kebab-case registry name (falls back to `tag`).
 * Uses createElement rather than `<Icon />` so the linter doesn't mistake the
 * registry lookup for a component defined during render.
 */
export function DynamicIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  return createElement(resolveIcon(name), {
    className: cn("size-4", className),
    "aria-hidden": "true",
  });
}
