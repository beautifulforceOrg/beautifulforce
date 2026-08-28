import { expect, test } from "@playwright/test";

test("customer can sign up, save a wishlist item, and see it on their account page", async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;

  await page.goto("/account/signup");
  await page.getByPlaceholder("Name").fill("E2E Shopper");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Hi, E2E Shopper" })).toBeVisible();

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Added to wishlist" })).toBeVisible();

  await page.goto("/account");
  await expect(page.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible();

  // Log out, then confirm the account page requires logging back in.
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  // Logging back in restores the same saved wishlist item.
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/);
  await expect(page.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible();
});

test("a signed-out visitor is sent to log in when trying to wishlist something", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page).toHaveURL(/\/account\/login$/);
});
