import type { DefaultSession } from "next-auth";

/**
 * Module augmentation: embed the app-specific fields carried in the JWT and
 * exposed on the session, so `session.user.id` / `isSuperAdmin` are typed.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    isSuperAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isSuperAdmin: boolean;
  }
}
