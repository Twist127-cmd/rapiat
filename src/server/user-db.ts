import { db } from "@/lib/db";

/**
 * Per-user isolation firewall — the most critical security barrier.
 *
 * `getUserDb(userId)` returns a Prisma client whose every query on a
 * user-scoped model is automatically constrained to that user:
 *   - reads/updates/deletes get `where.userId` injected;
 *   - creates get `data.userId` injected.
 *
 * Because business code only ever receives this extended client (via
 * `getUserContext()`), it is technically impossible to run a user-scoped query
 * without the user filter. A lookup by id for another user simply returns null
 * (a 404 at the UI layer), never another user's row — so the existence of
 * foreign resources is not disclosed. This is the personal-finance equivalent
 * of a multi-tenant isolation layer.
 *
 * This module depends ONLY on the raw db client (no auth), so it can be unit
 * tested against a real database in isolation.
 */

/** Models that carry a `userId` and must always be user-scoped. */
export const USER_MODELS = new Set<string>([
  "Account",
  "Category",
  "Transaction",
  "RecurringRule",
  "Budget",
  "SavingsGoal",
  "AuditLog",
]);

type AnyArgs = Record<string, unknown>;

export function getUserDb(userId: string) {
  return db.$extends({
    name: "user-isolation",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!USER_MODELS.has(model)) {
            return query(args);
          }

          const next = { ...(args as AnyArgs) };

          switch (operation) {
            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany": {
              next.where = { ...((next.where as AnyArgs) ?? {}), userId };
              break;
            }
            case "create": {
              next.data = { ...((next.data as AnyArgs) ?? {}), userId };
              break;
            }
            case "createMany":
            case "createManyAndReturn": {
              const data = next.data;
              next.data = Array.isArray(data)
                ? data.map((row) => ({ ...(row as AnyArgs), userId }))
                : { ...((data as AnyArgs) ?? {}), userId };
              break;
            }
            case "upsert": {
              next.where = { ...((next.where as AnyArgs) ?? {}), userId };
              next.create = { ...((next.create as AnyArgs) ?? {}), userId };
              break;
            }
            default:
              break;
          }

          return query(next);
        },
      },
    },
  });
}

/** The user-scoped client type shared by every service. */
export type UserDb = ReturnType<typeof getUserDb>;

/**
 * Context passed to service-layer functions: the user-scoped client plus the
 * userId itself (needed to stamp nested/related records the query extension
 * does not reach).
 */
export interface UserScope {
  db: UserDb;
  userId: string;
  currency: string;
  timezone: string;
}
