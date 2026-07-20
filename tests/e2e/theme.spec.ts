import { test, expect } from "@playwright/test";

import { login } from "./helpers";

test("bascule entre les thèmes Classique et Mode Marie", async ({ page }) => {
  await login(page);

  const html = page.locator("html");
  // Default family is Classique.
  await expect(html).toHaveAttribute("data-theme", "classique");

  // Switch to Mode Marie via the header switcher.
  await page.getByRole("button", { name: "Mode Marie" }).first().click();
  await expect(html).toHaveAttribute("data-theme", "marie");

  // The choice persists across reloads (localStorage + anti-flash script).
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "marie");
});
