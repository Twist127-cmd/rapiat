/**
 * Centralized result type for Server Actions.
 *
 * Actions never throw business errors to the client; they return a typed
 * discriminated union so the UI can render a French message on failure.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });
