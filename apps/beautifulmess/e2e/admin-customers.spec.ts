import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("an admin can see a real customer in the customer directory and export a CSV", async ({ page }) => {
  const email = `e2e_admin_customers_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Name").fill("Customers Directory Test");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);
  await page.getByRole("button", { name: "Log out" }).click();

  await loginAsAdmin(page);
  await page.goto("/admin/customers");
  await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Customers Directory Test")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("customers.csv");
});

test("the customer directory CSV export requires an admin session", async ({ page }) => {
  const response = await page.request.get("/api/admin/customers-csv");
  expect(response.status()).toBeGreaterThanOrEqual(400);
});
