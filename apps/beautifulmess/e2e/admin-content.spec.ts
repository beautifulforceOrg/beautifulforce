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

test("the real seeded testimonials and FAQ still render on the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Anjali Gautham")).toBeVisible();
  await expect(page.getByText("What is the return policy?")).toBeVisible();
});

test("an admin can add and remove a testimonial and FAQ item, and see it reflected on the homepage", async ({
  page,
}) => {
  const marker = `E2E Content Test ${Date.now()}`;

  await loginAsAdmin(page);
  await page.goto("/admin/content");

  const testimonialsSection = page.getByRole("region", { name: "Testimonials" });
  await testimonialsSection.getByPlaceholder("Customer name").fill(marker);
  await testimonialsSection.getByPlaceholder("Quote").fill(`${marker} quote`);
  await testimonialsSection.getByRole("button", { name: "Add" }).click();
  await expect(testimonialsSection.getByText(marker, { exact: true })).toBeVisible();

  const faqSection = page.getByRole("region", { name: "FAQ" });
  await faqSection.getByPlaceholder("Question").fill(`${marker}?`);
  await faqSection.getByPlaceholder("Answer").fill(`${marker} answer`);
  await faqSection.getByRole("button", { name: "Add" }).click();
  await expect(faqSection.getByText(`${marker}?`)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(marker, { exact: true })).toBeVisible();
  await expect(page.getByText(`${marker}?`)).toBeVisible();

  await page.goto("/admin/content");
  await testimonialsSection.getByRole("row", { name: new RegExp(marker) }).getByRole("button", { name: "Remove" }).click();
  await expect(testimonialsSection.getByText(marker, { exact: true })).toHaveCount(0);
  await faqSection.getByRole("row", { name: new RegExp(`${marker}\\?`) }).getByRole("button", { name: "Remove" }).click();
  await expect(faqSection.getByText(`${marker}?`)).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByText(marker, { exact: true })).toHaveCount(0);
});
