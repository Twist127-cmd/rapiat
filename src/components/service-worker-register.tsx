"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production and keeps it fresh.
 *
 * The SW script is fetched with `updateViaCache: "none"` (never from the HTTP
 * cache) and we trigger an `update()` check on load, so a new worker is picked
 * up promptly. We deliberately DO NOT force a reload on `controllerchange`:
 * doing so interrupted in-flight navigations (e.g. the login redirect), which
 * left the app looking "frozen". The SW is network-first for navigations, so
 * fresh content is served on the next navigation without any forced reload.
 * No-op in development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          void registration.update();
        })
        .catch(() => {
          // Registration failures are non-fatal — the app works without the SW.
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
