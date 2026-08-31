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

test("an admin can delete a review, which disappears from the public product page", async ({ page }) => {
  const email = `e2e_admin_review_${Date.now()}@example.com`;
  const marker = `e2e-admin-review-marker-${Date.now()}`;

  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/black-ruffle-seq-frock");
  await page.getByRole("radio", { name: "5", exact: true }).check();
  await page.getByPlaceholder("Share your experience with this product").fill(`Nice! ${marker}`);
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("You've reviewed this product. Thank you!")).toBeVisible();

  await loginAsAdmin(page);
  await page.goto("/admin/reviews");
  const row = page.getByRole("row", { name: new RegExp(marker) });
  await expect(row).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Review deleted.")).toBeVisible();

  await page.goto("/products/black-ruffle-seq-frock");
  await expect(page.getByText(marker)).not.toBeVisible();
});

test("an admin can mark a contact message as handled", async ({ page }) => {
  const email = `e2e_admin_contact_${Date.now()}@example.com`;
  const marker = `e2e-admin-contact-marker-${Date.now()}`;

  await page.goto("/help/contact");
  await page.getByPlaceholder("Name").fill("Admin Contact E2E");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder("Comment").fill(marker);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks for reaching out!")).toBeVisible();

  await loginAsAdmin(page);
  await page.goto("/admin/contact");
  const row = page.getByRole("row", { name: new RegExp(marker) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Mark handled" }).click();
  await expect(page.getByText("Marked handled.")).toBeVisible();

  await page.goto("/admin/contact");
  await expect(page.getByText(marker)).not.toBeVisible();
  await page.getByLabel("Show handled").check();
  await expect(page.getByText(marker)).toBeVisible();
});
