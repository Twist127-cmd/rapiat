import { db } from "@/lib/db";
import { requireSession } from "@/server/guards";
import { getUserDb } from "@/server/user-db";
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/config/constants";

export { getUserDb, type UserDb, type UserScope } from "@/server/user-db";

/**
 * One-call context for Server Actions / pages: enforces the session firewall
 * and returns the authenticated user, their preferences, and a user-scoped
 * Prisma client. Every mutation and query flows through the returned `db`.
 */
export async function getUserContext() {
  const sessionUser = await requireSession();
  const userId = sessionUser.id;

  const profile = await db.user.findUnique({
    where: { id: userId },
    select: { currency: true, timezone: true, name: true, email: true, themePreference: true },
  });

  const currency = profile?.currency ?? DEFAULT_CURRENCY;
  const timezone = profile?.timezone || DEFAULT_TIMEZONE;

  return {
    user: sessionUser,
    userId,
    currency,
    timezone,
    themePreference: profile?.themePreference ?? "classique",
    profileName: profile?.name ?? null,
    email: profile?.email ?? sessionUser.email ?? null,
    db: getUserDb(userId),
  };
}

export type UserContext = Awaited<ReturnType<typeof getUserContext>>;
