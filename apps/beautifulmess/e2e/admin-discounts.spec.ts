import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";
const CODE = `E2ETEST${Date.now()}`;

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("an admin can create a discount code, use it at real checkout, then deactivate it", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/discounts");
  await page.getByPlaceholder("Code (e.g. WELCOME10)").fill(CODE);
  await page.getByPlaceholder("Percent off").fill("10");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Discount created.")).toBeVisible();
  await expect(page.getByText(CODE)).toBeVisible();

  // Use it at real checkout.
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByLabel("Discount code").fill(CODE);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(new RegExp(`${CODE} applied`))).toBeVisible();

  // Deactivate it.
  await loginAsAdmin(page);
  await page.goto("/admin/discounts");
  await page.getByRole("row", { name: new RegExp(CODE) }).getByRole("button", { name: "Deactivate" }).click();
  await expect(page.getByText("Discount deactivated.")).toBeVisible();

  // Checkout then rejects it.
  await page.goto("/checkout");
  await page.getByLabel("Discount code").fill(CODE);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("That discount code isn't valid.")).toBeVisible();
});
