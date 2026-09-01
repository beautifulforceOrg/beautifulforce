import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";

test("an allowlisted, seeded admin can log in and reach the dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("a wrong password is rejected with a generic error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid credentials.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("visiting /admin directly while logged out redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("a customer session alone does not grant admin access", async ({ page }) => {
  const email = `e2e_admin_boundary_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test.describe("the storefront's Admin tab", () => {
  test("a customer whose email is also an allowlisted admin can jump into the dashboard with no second password", async ({
    page,
  }) => {
    // This customer (same email as the seeded e2e AdminUser, but a wholly
    // unrelated password -- the whole point of the tab is that no
    // customer-side credential ever needs to match the admin's) is seeded
    // once up front by pretest:e2e's seed-e2e-admin-customer.ts, not
    // signed up here: all 3 browser projects run this exact test
    // concurrently against the same shared local Postgres, and each
    // racing to sign up the same fixed email was a real, reproducible
    // flake (a raw Prisma unique-constraint error surfacing mid-test).
    await page.goto("/account/login");
    await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/Password/).fill("e2e admin-tab customer password");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/account$/);

    await page.goto("/");
    const [adminPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: "Admin" }).click(),
    ]);
    await adminPage.waitForURL(/\/admin$/);
    await expect(adminPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("a regular customer never sees the Admin tab, and /admin/enter still refuses them directly", async ({
    page,
  }) => {
    const email = `e2e_no_admin_tab_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);

    await page.goto("/admin/enter");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test("logging out clears the admin session", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
