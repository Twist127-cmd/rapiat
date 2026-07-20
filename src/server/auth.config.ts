import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * This module is imported by `middleware.ts`, which runs on the Edge runtime
 * where Prisma and bcrypt are unavailable. It therefore contains NO database or
 * provider code — the Credentials provider lives in `auth.ts` (Node runtime).
 * The `authorized` callback is the ROUTE FIREWALL: it protects every page
 * except the public auth routes.
 */
export const authConfig = {
  // Trust the deployment host (Vercel) so Auth.js resolves the callback URL
  // correctly behind the platform proxy in production.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // 30 days; the signed cookie is httpOnly + secure + sameSite by default.
    maxAge: 60 * 60 * 24 * 30,
  },
  // Real providers are injected in auth.ts to keep db/bcrypt out of the edge.
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const path = nextUrl.pathname;

      // Public auth pages (login / sign-up).
      if (path.startsWith("/login") || path.startsWith("/inscription")) {
        // Already authenticated users skip the auth pages.
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }

      // Everything else requires a session (redirects to /login otherwise).
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
