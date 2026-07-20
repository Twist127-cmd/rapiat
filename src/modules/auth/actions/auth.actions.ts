"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

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

/**
 * Form-bound login (progressive enhancement). Works even when client
 * JavaScript hasn't taken over the form — the browser POSTs the form to this
 * server action, which authenticates and redirects server-side (the session
 * cookie is set on the same response). This is the robust path for mobile,
 * where hydration can lag and a JS-only handler would fall back to a native
 * GET submit that does nothing.
 */
export async function loginRedirectAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/login?error=invalid");
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    // AuthError = bad credentials → back to login with a message. Any other
    // throw here is the NEXT_REDIRECT signal from a successful signIn; rethrow
    // it so Next performs the redirect to "/".
    if (error instanceof AuthError) {
      redirect("/login?error=credentials");
    }
    throw error;
  }
}

/**
 * Form-bound sign-up (progressive enhancement), same rationale as
 * `loginRedirectAction`: robust on mobile without relying on client JS.
 */
export async function signupRedirectAction(formData: FormData): Promise<void> {
  if (!env.NEXT_PUBLIC_ALLOW_SIGNUP) {
    redirect("/login");
  }
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect("/inscription?error=invalid");
  }

  try {
    const user = await registerUser(parsed.data);
    await recordAudit({ userId: user.id, userEmail: user.email, action: "signup" });
  } catch (error) {
    if (isDomainError(error)) {
      redirect("/inscription?error=email");
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account created but auto-login failed — send them to the login page.
      redirect("/login");
    }
    throw error;
  }
}

/** Sign the user out and redirect to the login page. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
