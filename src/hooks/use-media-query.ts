"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media-query hook (via useSyncExternalStore). The server snapshot is
 * `false`, so the first client render assumes "not matched" and reconciles on
 * mount — fine for our use (sheets/menus only matter after user interaction).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True below the Tailwind `md` breakpoint (i.e. phones/small tablets). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
