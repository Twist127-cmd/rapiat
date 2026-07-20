"use client";

import { useSyncExternalStore } from "react";

import type { ThemeFamily } from "@/config/constants";

const STORAGE_KEY = "rapiat-theme-family";

/**
 * The theme FAMILY (classique | marie) is an external system — it lives on the
 * <html> `data-theme` attribute (set before paint by the inline script below)
 * and in localStorage. We read it with `useSyncExternalStore`, which hydrates
 * cleanly (server snapshot = "classique") and re-renders subscribers whenever
 * the family changes. The light/dark mode is handled separately by next-themes.
 */
const listeners = new Set<() => void>();

function normalize(value: string | null | undefined): ThemeFamily {
  return value === "marie" ? "marie" : "classique";
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): ThemeFamily {
  return normalize(document.documentElement.dataset.theme);
}

function getServerSnapshot(): ThemeFamily {
  return "classique";
}

function applyFamily(family: ThemeFamily): void {
  document.documentElement.dataset.theme = family;
  try {
    window.localStorage.setItem(STORAGE_KEY, family);
  } catch {
    // Ignore storage failures (private mode, etc.) — the DOM is still updated.
  }
  listeners.forEach((listener) => listener());
}

interface ThemeFamilyValue {
  family: ThemeFamily;
  setFamily: (family: ThemeFamily) => void;
}

export function useThemeFamily(): ThemeFamilyValue {
  const family = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { family, setFamily: applyFamily };
}

/**
 * Passthrough provider kept for layout composition symmetry (and a future home
 * for cross-cutting theme concerns). State lives in the external store above.
 */
export function ThemeFamilyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Blocking script injected in <head>: reads the stored family and stamps
 * `data-theme` on <html> before paint. Mirrors next-themes' anti-flash trick.
 */
export const THEME_FAMILY_SCRIPT = `(function(){try{var f=localStorage.getItem("${STORAGE_KEY}");if(f!=="classique"&&f!=="marie"){f="classique";}document.documentElement.dataset.theme=f;}catch(e){document.documentElement.dataset.theme="classique";}})();`;
