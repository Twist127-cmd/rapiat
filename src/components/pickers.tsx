"use client";

import { COLOR_PALETTE, ICON_NAMES, resolveIcon } from "@/config/icons";
import { cn } from "@/lib/utils";

/** Swatch grid + native color input for choosing a hex color. */
export function ColorPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (color: string) => void;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" id={id}>
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Couleur ${color}`}
          aria-pressed={value.toLowerCase() === color.toLowerCase()}
          onClick={() => onChange(color)}
          className={cn(
            "size-7 rounded-full border-2 transition-transform",
            value.toLowerCase() === color.toLowerCase()
              ? "border-foreground scale-110"
              : "border-transparent",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
      <input
        type="color"
        aria-label="Couleur personnalisée"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 cursor-pointer rounded-full border bg-transparent p-0"
      />
    </div>
  );
}

/** Grid of curated icons. */
export function IconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (icon: string) => void;
  id?: string;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5" id={id}>
      {ICON_NAMES.map((name) => {
        const Icon = resolveIcon(name);
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            aria-label={`Icône ${name}`}
            aria-pressed={active}
            onClick={() => onChange(name)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md border transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
