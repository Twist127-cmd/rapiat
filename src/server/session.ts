import { auth } from "@/server/auth";
import type { Session } from "next-auth";

export type SessionUser = Session["user"];

/** Returns the current session (or null). Thin wrapper around Auth.js `auth()`. */
export async function getSession(): Promise<Session | null> {
  return auth();
}

/** Returns the current user (or null) without throwing. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}
