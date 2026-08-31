import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";

test("the dashboard home page loads revenue and top-products sections after a real purchase", async ({ page }) => {
  // Complete a real purchase so there's something to show.
  const email = `e2e_admin_dashboard_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Dashboard Test");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone number").fill("9876500002");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Unit 1");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560001");
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);

  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await expect(page.getByRole("heading", { name: "Revenue, last 14 days" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Top products, last 30 days" })).toBeVisible();
});
