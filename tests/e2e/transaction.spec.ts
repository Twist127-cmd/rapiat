import { test, expect } from "@playwright/test";

import { login } from "./helpers";

test("ajoute une transaction de dépense", async ({ page }) => {
  await login(page);
  await page.goto("/transactions");

  await page.getByRole("button", { name: "Ajouter" }).first().click();

  // Amount + note in the dialog.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Montant").fill("42.50");
  await dialog.getByLabel("Note").fill("Test e2e");
  await dialog.getByRole("button", { name: "Ajouter" }).click();

  // Toast confirms and the row appears.
  await expect(page.getByText("Test e2e")).toBeVisible();
});
