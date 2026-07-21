import { test, expect } from "@playwright/test";

import { login } from "./helpers";

test("ajoute une transaction de dépense", async ({ page }) => {
  await login(page);
  await page.goto("/transactions");

  // Open the create dialog from the page header.
  await page.getByRole("button", { name: "Ajouter" }).first().click();

  // The dialog is identified by its title.
  await expect(page.getByText("Nouvelle transaction")).toBeVisible();

  await page.getByLabel("Montant").fill("42.50");
  await page.getByLabel("Note").fill("Test e2e");

  // Submit (the dialog's confirm button is the last "Ajouter").
  await page.getByRole("button", { name: "Ajouter" }).last().click();

  // The new row appears in the desktop table (mobile cards are hidden here).
  await expect(page.locator("table").getByText("Test e2e").first()).toBeVisible();
});
