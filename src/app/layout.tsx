import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Fredoka } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ThemeFamilyProvider,
  THEME_FAMILY_SCRIPT,
} from "@/components/theme-family-provider";
import { MarieDecor } from "@/components/marie-decor";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { env } from "@/lib/env";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/** Elegant display serif for the Classique theme headings. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

/** Round, playful display font for the Mode Marie theme headings. */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s · ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "Rapiat — gérez vos finances personnelles : revenus, dépenses fixes et variables, épargne et budgets.",
  appleWebApp: {
    capable: true,
    title: env.NEXT_PUBLIC_APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e2a4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${fredoka.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the stored theme family before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_FAMILY_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ThemeFamilyProvider>
            <MarieDecor />
            {children}
            <Toaster richColors position="top-center" />
            <ServiceWorkerRegister />
          </ThemeFamilyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
