import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SignupForm } from "@/modules/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function SignupPage() {
  // Registration can be locked to the single owner once the app is set up.
  if (!env.NEXT_PUBLIC_ALLOW_SIGNUP) notFound();
  return <SignupForm />;
}
