import type { DefaultSession } from "next-auth";

/**
 * Module augmentation: embed the app-specific fields carried in the JWT and
 * exposed on the session, so `session.user.id` etc. are strongly typed.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
