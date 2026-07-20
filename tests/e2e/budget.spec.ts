import { test, expect } from "@playwright/test";

import { login } from "./helpers";

test("crée un budget par catégorie", async ({ page }) => {
  await login(page);
  await page.goto("/budgets");

  await page.getByRole("button", { name: "Nouveau budget" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Montant").fill("300");
  await dialog.getByRole("button", { name: /Créer le budget/ }).click();

  // The budgets grid shows a progress figure once the budget exists.
  await expect(page.getByText(/restant|de trop/).first()).toBeVisible();
});
