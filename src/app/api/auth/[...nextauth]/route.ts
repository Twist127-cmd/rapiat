import { handlers } from "@/server/auth";

/**
 * Auth.js HTTP endpoints (`/api/auth/*`): CSRF token, session, sign-in/out
 * callbacks. The app's own flows use the server actions in the auth module and
 * `auth()` in server components, but mounting the standard handler keeps the
 * session/CSRF endpoints available and leaves the door open for OAuth providers.
 */
export const { GET, POST } = handlers;
