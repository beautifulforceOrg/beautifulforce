import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";
const SLUG = `admin-e2e-test-product-${Date.now()}`;

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("an admin can create a product with full inventory attributes, add a variant, publish/unpublish, and assign a collection", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/admin/products/new");
  const nameInput = page.locator("label", { hasText: "Name" }).locator("input");
  const slugInput = page.locator("label", { hasText: "Slug" }).locator("input");
  const priceInput = page.locator("label", { hasText: "Selling price" }).locator("input");
  const skuInput = page.locator("label", { hasText: /^SKU$/ }).locator("input");
  const weightInput = page.locator("label", { hasText: /^Weight \(g\)$/ }).locator("input");
  const packageWeightInput = page.locator("label", { hasText: "Package weight (g)" }).locator("input");

  await nameInput.fill("Admin E2E Test Product");
  await slugInput.fill(SLUG);
  await priceInput.fill("1999");
  await skuInput.fill(`E2E-SKU-${Date.now()}`);
  await weightInput.fill("150");
  await packageWeightInput.fill("200");

  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/\/admin\/products\/(?!new$)[^/]+$/);
  const productAdminUrl = page.url();

  // Everything past this point runs inside try/finally: this product is
  // deliberately published into the real "Frocks" collection at an
  // unrealistic ₹19.99 to exercise publish/unpublish -- if any assertion
  // below throws without this, the product leaks into the collection
  // permanently (local Postgres isn't reset between e2e runs), which is
  // exactly what corrupted e2e/storefront-features.spec.ts's price-range
  // filter test days later: the leaked ₹19.99 item inflated the
  // unfiltered item count but then got excluded once a real minimum price
  // was applied, making a correct filter look like an off-by-one bug.
  try {
    // Add a variant.
    await page.getByPlaceholder("Name (e.g. Size)").fill("Size");
    await page.getByPlaceholder("Value (e.g. M)").fill("M");
    await page.getByRole("button", { name: "Add variant" }).click();
    await expect(page.getByText("Size: M")).toBeVisible();

    // Assign a collection.
    await page.getByLabel("Frocks").click();
    await expect(page.getByLabel("Frocks")).toBeChecked();

    // Visible on the storefront while published.
    await page.goto(`/products/${SLUG}`);
    await expect(page.getByRole("heading", { name: "ADMIN E2E TEST PRODUCT" })).toBeVisible();
    await page.goto("/shop/frocks");
    await expect(page.getByText("Admin E2E Test Product").first()).toBeVisible();

    // Unpublish from the admin edit page -- disappears from the storefront.
    await page.goto(productAdminUrl);
    await page.getByLabel("Published (visible on the storefront)").uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    const unpublishedResponse = await page.request.get(`/products/${SLUG}`);
    expect(unpublishedResponse.status()).toBe(404);
  } finally {
    // Clean up -- delete the test product, even if an assertion above failed.
    await page.goto(productAdminUrl);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete product" }).click();
    await page.waitForURL(/\/admin\/products$/);
  }
});
