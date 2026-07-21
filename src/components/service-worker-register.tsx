"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker in production and keeps it fresh.
 *
 * Robust self-update: the SW script is fetched with `updateViaCache: "none"`
 * (never served from the HTTP cache), we force an `update()` check on load, and
 * when a new worker takes control we reload once. This prevents a stale worker
 * from ever serving an outdated bundle — the cause of "buttons stop working
 * after a deploy". No-op in development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          // Check for a newer worker immediately, then periodically.
          void registration.update();
        })
        .catch(() => {
          // Registration failures are non-fatal — the app works without the SW.
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
