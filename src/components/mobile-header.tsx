"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { screenTitle } from "@/config/navigation";

/** Compact mobile header: logo + contextual screen title (< md only). */
export function MobileHeader({ appName }: { appName: string }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-2 md:hidden">
      <Image
        src="/logo.png"
        alt={appName}
        width={28}
        height={28}
        className="rounded-lg object-contain"
        priority
      />
      <span className="font-heading text-lg font-semibold">{screenTitle(pathname)}</span>
    </div>
  );
}
