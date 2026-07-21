"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Light/dark switch. Both icons are always in the DOM and toggled via the
 * `dark:` CSS variant (driven by the `.dark` class next-themes puts on <html>),
 * so the server and client render identical markup — no hydration mismatch.
 * `resolvedTheme` is read only inside the click handler, never during render.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Changer le thème clair/sombre"
      title="Changer le thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
