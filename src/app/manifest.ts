import type { MetadataRoute } from "next";

/** Web app manifest — enables "Add to home screen" with the Rapiat logo. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rapiat",
    short_name: "Rapiat",
    description:
      "Gestion des finances personnelles : revenus, dépenses, épargne et budgets.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f0",
    theme_color: "#1e2a4a",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
