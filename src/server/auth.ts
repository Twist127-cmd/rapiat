import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";
import { loginSchema } from "@/modules/auth/schemas";

/**
 * Full Auth.js instance (Node runtime). Adds the Credentials provider on top of
 * the edge-safe base config. Password verification uses bcrypt.
 *
 * DESIGN NOTE: Auth.js v5's Credentials provider is only supported with the JWT
 * session strategy. Sessions are therefore carried in a signed, httpOnly,
 * secure cookie. The userId is embedded in the token so every request is
 * user-scoped without an extra DB round-trip.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await recordAudit({
          userId: user.id,
          userEmail: user.email,
          action: "login",
          detail: "Connexion réussie",
        });
      }
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          // Compare against a dummy hash to reduce timing-based user enumeration.
          await bcrypt.compare(
            password,
            "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidina",
          );
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
});
