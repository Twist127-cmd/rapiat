import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Rapiat wordmark: the official piggy-bank logo (public/logo.png) plus the
 * product name. `showName` hides the label for compact placements.
 */
export function BrandLogo({
  className,
  size = 36,
  showName = true,
  appName = "Rapiat",
}: {
  className?: string;
  size?: number;
  showName?: boolean;
  appName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt={appName}
        width={size}
        height={size}
        className="rounded-xl object-contain"
        priority
      />
      {showName ? (
        <span className="font-heading text-xl font-semibold tracking-tight">{appName}</span>
      ) : null}
    </span>
  );
}
