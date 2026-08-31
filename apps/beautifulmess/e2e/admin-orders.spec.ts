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

test("an admin can place a real storefront order, find it, filter by status, and force a status change that reflects on the customer's account page", async ({
  page,
}) => {
  // Place a real order as a shopper first.
  const customerEmail = `e2e_admin_orders_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(customerEmail);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Order Admin Test");
  await page.getByLabel("Email", { exact: true }).fill(customerEmail);
  await page.getByLabel("Phone number").fill("9876500001");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Unit 1");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560001");
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);
  const gatewayOrderId = new URL(page.url()).pathname.split("/orders/")[1]!;

  // Find it in the admin orders list.
  await loginAsAdmin(page);
  await page.goto(`/admin/orders?q=${gatewayOrderId}`);
  await expect(page.getByRole("link", { name: gatewayOrderId })).toBeVisible();

  // Filter by status excludes it once it's not PENDING (it starts PENDING).
  await page.goto("/admin/orders?status=FULFILLED");
  await expect(page.getByText(gatewayOrderId)).not.toBeVisible();

  // Open the detail page and force a status change.
  await page.goto(`/admin/orders?q=${gatewayOrderId}`);
  await page.getByRole("link", { name: gatewayOrderId }).click();
  await expect(page.getByRole("heading", { name: `Order ${gatewayOrderId}` })).toBeVisible();
  await expect(page.getByText("Order Admin Test")).toBeVisible();

  await page.getByLabel("Status").selectOption("FULFILLED");
  await expect(page.getByText("Order status updated.")).toBeVisible();

  // Reflects on the customer's own account page.
  await page.goto("/account/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(customerEmail);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/);
  await expect(page.getByText("FULFILLED")).toBeVisible();
});
