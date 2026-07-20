"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/server/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { isDomainError } from "@/lib/errors";
import { recordAudit } from "@/server/audit";
import { env } from "@/lib/env";
import { loginSchema, signupSchema } from "@/modules/auth/schemas";
import { registerUser } from "@/modules/auth/services/user.service";

/**
 * Create an account then sign the user in. Registration is gated by
 * NEXT_PUBLIC_ALLOW_SIGNUP so the deployed instance can be locked to a single
 * owner once set up.
 */
export async function signupAction(input: unknown): Promise<ActionResult<null>> {
  if (!env.NEXT_PUBLIC_ALLOW_SIGNUP) {
    return fail("Les inscriptions sont désactivées.");
  }
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  }
  try {
    const user = await registerUser(parsed.data);
    await recordAudit({ userId: user.id, userEmail: user.email, action: "signup" });
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok(null);
  } catch (error) {
    if (isDomainError(error)) return fail(error.message);
    if (error instanceof AuthError) return fail("Impossible de vous connecter après l'inscription.");
    throw error;
  }
}

/**
 * Verify credentials and open a session. Returns a typed result so the form can
 * show a single generic message (anti-enumeration: never reveal whether the
 * e-mail exists).
 */
export async function loginAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok(null);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("E-mail ou mot de passe incorrect.");
    }
    throw error;
  }
}

/** Sign the user out and redirect to the login page. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
