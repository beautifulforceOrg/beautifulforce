import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin-e2e-test@example.com";
const ADMIN_PASSWORD = "correct horse battery";
const SUBJECT = `E2E ticket ${Date.now()}`;

test("an admin can file a ticket, add a comment, change its status, and see it in the filtered list", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/tickets/new");
  await page.locator("label", { hasText: "Subject" }).locator("input").fill(SUBJECT);
  await page.locator("label", { hasText: "Category" }).locator("select").selectOption("FEATURE");
  await page.locator("label", { hasText: "Description" }).locator("textarea").fill("Please add gift wrapping at checkout.");
  await page.getByRole("button", { name: "Create ticket" }).click();
  await page.waitForURL(/\/admin\/tickets\/(?!new$)[^/]+$/);

  await expect(page.getByRole("heading", { name: SUBJECT })).toBeVisible();
  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();

  await page.getByPlaceholder("Add a comment").fill("Looking into it.");
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.getByText("Looking into it.")).toBeVisible();

  await page.getByLabel("Status").selectOption("IN_PROGRESS");
  await expect(page.getByText("Ticket status updated.")).toBeVisible();

  await page.goto("/admin/tickets");
  await expect(page.getByRole("link", { name: SUBJECT })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(SUBJECT) })).toContainText("IN_PROGRESS");
});
