"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production. The SW is network-first
 * (see public/sw.js), so it never serves stale data — it only adds an offline
 * fallback for the installed PWA. No-op in development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app works without the SW.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
