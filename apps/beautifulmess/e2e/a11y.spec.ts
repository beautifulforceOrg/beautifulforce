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

test("collection page has no accessibility violations", async ({ page }) => {
  await page.goto("/shop/frocks");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("search page has no accessibility violations", async ({ page }) => {
  await page.goto("/search?q=frock");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("empty cart page has no accessibility violations", async ({ page }) => {
  await page.goto("/cart");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("login page has no accessibility violations", async ({ page }) => {
  await page.goto("/account/login");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("account, checkout, and account settings pages have no accessibility violations", async ({ page }) => {
  const email = `e2e_a11y_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  const accountResults = await new AxeBuilder({ page }).analyze();
  expect(accountResults.violations).toEqual([]);

  await page.goto("/account/settings");
  const settingsResults = await new AxeBuilder({ page }).analyze();
  expect(settingsResults.violations).toEqual([]);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  const checkoutResults = await new AxeBuilder({ page }).analyze();
  expect(checkoutResults.violations).toEqual([]);
});
