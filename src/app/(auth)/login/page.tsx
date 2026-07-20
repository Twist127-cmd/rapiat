import type { Metadata } from "next";

import { LoginForm } from "@/modules/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Connexion",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  return <LoginForm allowSignup={env.NEXT_PUBLIC_ALLOW_SIGNUP} error={error} />;
}
