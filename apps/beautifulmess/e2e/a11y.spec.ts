import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

// Every static, no-auth-required page in the app -- content pages, forms
// with no prior state, and the 404 boundary. Looped rather than one test
// each since they share no setup and a single a11y assertion each.
const STATIC_PAGES = [
  "/",
  "/about",
  "/shop",
  "/search",
  "/help/careers",
  "/help/contact",
  "/help/franchise",
  "/help/press",
  "/policies/privacy",
  "/policies/refund",
  "/policies/shipping",
  "/policies/terms",
  "/account/login",
  "/account/signup",
  "/admin/login",
  "/cart",
  "/this-page-does-not-exist",
];

for (const path of STATIC_PAGES) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test("product detail page has no accessibility violations", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await expectNoViolations(page);
});

test("collection page has no accessibility violations", async ({ page }) => {
  await page.goto("/shop/frocks");
  await expectNoViolations(page);
});

test("account, checkout, order status, and account settings pages have no accessibility violations", async ({
  page,
}) => {
  const email = `e2e_a11y_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);
  await expectNoViolations(page);

  await page.goto("/account/settings");
  await expectNoViolations(page);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await expectNoViolations(page);

  await page.getByLabel("Full name").fill("A11y Test");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone number").fill("9876500003");
  await page.getByLabel("Address", { exact: true }).fill("1 A11y Street");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Unit 1");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560001");
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);
  await expectNoViolations(page);
});

// Every admin list/dashboard page, once logged in -- no per-row detail
// pages needed for these, so a single loop covers them all.
const ADMIN_STATIC_PAGES = [
  "/admin",
  "/admin/customers",
  "/admin/products",
  "/admin/products/new",
  "/admin/orders",
  "/admin/discounts",
  "/admin/reviews",
  "/admin/contact",
  "/admin/tickets",
  "/admin/tickets/new",
  "/admin/content",
];

test("admin dashboard and list pages have no accessibility violations", async ({ page }) => {
  // Looping through 11 routes, each a fresh dev-server compile plus an
  // axe scan, runs close to the default 30s timeout -- bumped, not
  // flaky (confirmed passing standalone at ~26s).
  test.setTimeout(60_000);
  await loginAsAdmin(page);
  for (const path of ADMIN_STATIC_PAGES) {
    await page.goto(path);
    await expectNoViolations(page);
  }
});

test("admin product edit, ticket detail, and order detail pages have no accessibility violations", async ({
  page,
}) => {
  await loginAsAdmin(page);

  // Product edit page -- needs a real product id, not just a slug.
  const slug = `a11y-test-product-${Date.now()}`;
  await page.goto("/admin/products/new");
  await page.locator("label", { hasText: "Name" }).locator("input").fill("A11y Test Product");
  await page.locator("label", { hasText: "Slug" }).locator("input").fill(slug);
  await page.locator("label", { hasText: "Selling price" }).locator("input").fill("999");
  await page.locator("label", { hasText: /^SKU$/ }).locator("input").fill(`A11Y-SKU-${Date.now()}`);
  await page.locator("label", { hasText: /^Weight \(g\)$/ }).locator("input").fill("150");
  await page.locator("label", { hasText: "Package weight (g)" }).locator("input").fill("200");
  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/\/admin\/products\/(?!new$)[^/]+$/);
  await expectNoViolations(page);

  // Ticket detail page -- needs a real ticket id.
  const subject = `A11y test ticket ${Date.now()}`;
  await page.goto("/admin/tickets/new");
  await page.locator("label", { hasText: "Subject" }).locator("input").fill(subject);
  await page.locator("label", { hasText: "Description" }).locator("textarea").fill("Checking ticket detail a11y.");
  await page.getByRole("button", { name: "Create ticket" }).click();
  await page.waitForURL(/\/admin\/tickets\/(?!new$)[^/]+$/);
  await expectNoViolations(page);

  // Order detail page -- reuses whatever real order already exists from
  // this project's other e2e coverage (admin-orders.spec.ts creates one),
  // falling back to skipping cleanly if none exists yet in this run.
  await page.goto("/admin/orders");
  const firstOrderLink = page.getByRole("link").filter({ hasText: /^order_/ }).first();
  if (await firstOrderLink.count()) {
    await firstOrderLink.click();
    await expectNoViolations(page);
  }
});
