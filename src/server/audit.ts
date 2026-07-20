import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Best-effort audit logging (journalisation des actions sensibles). Writes are
 * user-scoped and never throw: a logging failure must not break the
 * user-facing action.
 */
export async function recordAudit(entry: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  detail?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        action: entry.action,
        detail: entry.detail ?? null,
        meta: entry.meta,
      },
    });
  } catch {
    // Swallow: auditing is best-effort.
  }
}
