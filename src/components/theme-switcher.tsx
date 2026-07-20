"use client";

import { useTransition } from "react";
import { Palette, Umbrella } from "lucide-react";

import { useThemeFamily } from "@/components/theme-family-provider";
import { saveThemePreferenceAction } from "@/modules/settings/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Switches between the two visual theme families instantly (no reload) and
 * persists the choice both locally and to the user profile.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { family, setFamily } = useThemeFamily();
  const [, startTransition] = useTransition();

  function choose(next: "classique" | "marie") {
    setFamily(next);
    startTransition(() => {
      void saveThemePreferenceAction(next);
    });
  }

  return (
    <div
      className={cn("flex items-center gap-1 rounded-full border p-1", className)}
      role="group"
      aria-label="Choix du thème"
    >
      <Button
        type="button"
        variant={family === "classique" ? "default" : "ghost"}
        size="sm"
        className="rounded-full"
        aria-pressed={family === "classique"}
        onClick={() => choose("classique")}
      >
        <Palette className="size-4" />
        <span className="hidden sm:inline">Classique</span>
      </Button>
      <Button
        type="button"
        variant={family === "marie" ? "default" : "ghost"}
        size="sm"
        className="rounded-full"
        aria-pressed={family === "marie"}
        onClick={() => choose("marie")}
      >
        <Umbrella className="size-4" />
        <span className="hidden sm:inline">Mode Marie</span>
      </Button>
    </div>
  );
}
