import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

/**
 * Route firewall. Runs the edge-safe Auth.js config on every matched request;
 * the `authorized` callback redirects unauthenticated users to /login before
 * any page or Server Action executes.
 */
const { auth } = NextAuth(authConfig);

// Default export as an explicit function so Next.js statically detects it.
export default auth;

export const config = {
  // Match everything except Next internals, the auth API, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
