import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SignupForm } from "@/modules/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Inscription",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  // Registration can be locked to the single owner once the app is set up.
  if (!env.NEXT_PUBLIC_ALLOW_SIGNUP) notFound();
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  return <SignupForm error={error} />;
}
