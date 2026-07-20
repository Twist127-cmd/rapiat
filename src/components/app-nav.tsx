"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop sidebar (md and up). */
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

/** Mobile bottom bar (below md). Shows only items flagged `mobile`. */
export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.mobile);

  // Pull out the emphasized center entry and split the rest around it so it
  // sits in the middle as a raised, prominent tab.
  const center = items.find((item) => item.mobileCenter);
  const rest = items.filter((item) => !item.mobileCenter);
  const mid = Math.ceil(rest.length / 2);
  const ordered = center ? [...rest.slice(0, mid), center, ...rest.slice(mid)] : rest;

  return (
    <nav
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 flex items-end border-t pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur md:hidden"
      aria-label="Navigation mobile"
    >
      {ordered.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        if (item.mobileCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 text-[11px] font-medium"
            >
              <span
                className={cn(
                  "-mt-6 flex size-14 items-center justify-center rounded-full border-4 shadow-lg transition-transform",
                  active
                    ? "bg-primary text-primary-foreground border-background scale-105"
                    : "bg-primary/90 text-primary-foreground border-background",
                )}
              >
                <Icon className="size-6" />
              </span>
              <span className={cn(active ? "text-primary" : "text-foreground")}>{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("size-5", active && "scale-110")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
