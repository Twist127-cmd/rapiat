import type { Metadata } from "next";

import { LoginForm } from "@/modules/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return <LoginForm allowSignup={env.NEXT_PUBLIC_ALLOW_SIGNUP} />;
}
