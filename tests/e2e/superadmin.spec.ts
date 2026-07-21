import { test, expect, type Page } from "@playwright/test";

const SA_EMAIL = "admin@rapiat.ch";
const SA_PASSWORD = "E876Pwn_MWgh9PCZTT";
const SHOTS = "docs/screenshots";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/");
}

test.describe("Console super-admin", () => {
  test("accès superadmin : console, utilisateurs, journaux", async ({ page }) => {
    await loginAs(page, SA_EMAIL, SA_PASSWORD);

    await page.goto("/superadmin");
    await expect(page.getByRole("heading", { name: "Console super-admin" })).toBeVisible();
    await expect(page.getByText("Utilisateurs").first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/superadmin-console.png`, fullPage: true });

    await page.goto("/superadmin/utilisateurs");
    await expect(page.getByRole("heading", { name: "Utilisateurs" })).toBeVisible();
    await expect(page.getByText("demo@rapiat.ch")).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/superadmin-users.png`, fullPage: true });

    await page.goto("/superadmin/journaux");
    await expect(page.getByRole("heading", { name: "Journaux d'activité" })).toBeVisible();
    await expect(page.getByText("login").first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/superadmin-logs.png`, fullPage: true });
  });

  test("un compte normal ne peut pas accéder à la console (404)", async ({ page }) => {
    await loginAs(page, "demo@rapiat.ch", "Demo1234!");
    const res = await page.goto("/superadmin");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Console super-admin" })).toHaveCount(0);
  });
});
