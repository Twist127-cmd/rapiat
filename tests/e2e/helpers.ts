import { expect, type Page } from "@playwright/test";

/** Demo credentials created by `pnpm db:seed`. */
export const DEMO_EMAIL = "demo@rapiat.ch";
export const DEMO_PASSWORD = "Demo1234!";

/** Log in as the seeded demo user and wait for the dashboard. */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(DEMO_EMAIL);
  await page.getByLabel("Mot de passe").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
}
