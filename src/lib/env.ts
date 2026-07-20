/**
 * Configuration firewall.
 *
 * Environment variables are validated with Zod at process startup. If a
 * required secret is missing or malformed, the application refuses to boot
 * instead of failing later with an obscure runtime error. Secrets live in the
 * `server` block and can never be bundled into client code; only values under
 * the `NEXT_PUBLIC_` prefix are exposed to the browser.
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /** Server-only variables. Referencing any of these in client code throws. */
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit faire au moins 32 caractères"),
    AUTH_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  /** Client-exposed variables. Must be prefixed with `NEXT_PUBLIC_`. */
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Rapiat"),
    NEXT_PUBLIC_ALLOW_SIGNUP: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
  },

  /**
   * Next.js edge/client runtimes do not expose `process.env` as a plain object,
   * so destructured values must be listed explicitly.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_ALLOW_SIGNUP: process.env.NEXT_PUBLIC_ALLOW_SIGNUP,
  },

  /** Treat empty strings as undefined so blank .env lines fail validation. */
  emptyStringAsUndefined: true,

  /** Allows `pnpm build` in CI without a full env (skipped at lint/typecheck). */
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
