"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LayoutDashboard, Users, ScrollText, ArrowLeft, LogOut } from "lucide-react";

import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/superadmin", label: "Console", icon: LayoutDashboard },
  { href: "/superadmin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/superadmin/journaux", label: "Journaux", icon: ScrollText },
];

function active(pathname: string, href: string): boolean {
  return href === "/superadmin" ? pathname === "/superadmin" : pathname.startsWith(href);
}

export function SuperadminNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const on = active(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
              on ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Retour à l'app</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => startTransition(() => logoutAction())}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
}
