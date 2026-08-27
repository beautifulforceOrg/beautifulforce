import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("product detail page has no accessibility violations", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
