import type { Metadata } from "next";

import { getUserContext } from "@/server/data-access";
import { db } from "@/lib/db";
import { SettingsView } from "@/modules/settings";
import { listCategories } from "@/modules/categories";
import { DEFAULT_DATE_FORMAT } from "@/config/constants";
import type { ProfileInput } from "@/modules/settings";

export const metadata: Metadata = {
  title: "Paramètres",
};

const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"] as const;

export default async function SettingsPage() {
  const ctx = await getUserContext();
  const [user, categories] = await Promise.all([
    db.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, currency: true, timezone: true, dateFormat: true },
    }),
    listCategories(ctx),
  ]);

  const dateFormat = (
    DATE_FORMATS as readonly string[]
  ).includes(user?.dateFormat ?? "")
    ? (user!.dateFormat as ProfileInput["dateFormat"])
    : DEFAULT_DATE_FORMAT;

  const profile: ProfileInput = {
    name: user?.name ?? "",
    currency: (user?.currency ?? "CHF") as ProfileInput["currency"],
    timezone: user?.timezone ?? "Europe/Zurich",
    dateFormat,
  };

  return <SettingsView profile={profile} categories={categories} />;
}
