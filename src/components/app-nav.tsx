"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Desktop sidebar (md and up). On mobile, navigation is handled by the floating
 * bubble (`components/mobile-nav.tsx`) instead of a bottom bar.
 */
export function SideNav({ appName }: { appName: string }) {
  const pathname = usePathname();
  return (
    <aside className="bg-sidebar hidden w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex items-center gap-2 px-4 py-5">
        <Image
          src="/logo.png"
          alt={appName}
          width={32}
          height={32}
          className="rounded-lg object-contain"
          priority
        />
        <span className="font-heading text-lg font-semibold">{appName}</span>
      </div>
      <nav className="flex flex-col gap-1 px-2" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
