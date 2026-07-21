import { test, expect } from "@playwright/test";

import { login } from "./helpers";

// Mobile viewport (iPhone 14-ish) with touch.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

const SHOTS = "docs/screenshots";

test.describe("Mobile — navigation bulle & saisie rapide", () => {
  test("affiche le dashboard sans bottom bar et ouvre la bulle", async ({ page }) => {
    await login(page);
    await page.screenshot({ path: `${SHOTS}/mobile-dashboard.png`, fullPage: true });

    // The floating bubble FAB is present; the old bottom bar is gone.
    const fab = page.getByRole("button", { name: "Ouvrir le menu" });
    await expect(fab).toBeVisible();

    await fab.click();
    // Menu unfolds with the quick action + primary tabs.
    await expect(page.getByRole("menuitem", { name: /Nouvelle transaction/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Transactions" })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/mobile-nav-open.png` });
  });

  test("saisie rapide d'une transaction depuis la bulle", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("menuitem", { name: /Nouvelle transaction/ }).click();

    // Quick-entry sheet.
    await expect(page.getByText("Nouvelle transaction")).toBeVisible();
    await page.locator("#qt-amount").fill("23.90");
    // Pick the first expense category chip.
    await page.getByRole("button", { name: "Alimentation" }).first().click();
    await page.screenshot({ path: `${SHOTS}/mobile-quick-entry.png` });
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.getByText("Transaction enregistrée.")).toBeVisible();
  });

  test("navigue vers Budgets via la bulle", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("menuitem", { name: "Budgets" }).click();
    await expect(page).toHaveURL(/\/budgets/);
    await page.screenshot({ path: `${SHOTS}/mobile-budgets.png`, fullPage: true });
  });

  test("le menu Plus donne accès aux pages secondaires et au thème", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("menuitem", { name: "Plus" }).click();
    await expect(page.getByRole("link", { name: "Paramètres" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Épargne" })).toBeVisible();
  });
});
