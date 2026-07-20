import { redirect } from "next/navigation";

import { getSession, type SessionUser } from "@/server/session";

/**
 * Session firewall. Every Server Action and protected page begins by calling
 * this. It redirects (rather than returning a nullable value), so callers can
 * rely on a non-null result.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}
