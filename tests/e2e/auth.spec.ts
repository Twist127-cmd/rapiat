import { test, expect } from "@playwright/test";

import { login, DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test.describe("Authentification", () => {
  test("redirige les visiteurs non connectés vers /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("refuse des identifiants invalides", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(DEMO_EMAIL);
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("connecte l'utilisateur de démo", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$|\/$/);
    expect(DEMO_PASSWORD.length).toBeGreaterThan(0);
  });
});
