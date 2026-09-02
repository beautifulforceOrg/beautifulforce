import { expect, test, type Browser } from "@playwright/test";

async function loginAsExisting(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/account/login");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/);
  return { context, page };
}

test("a logged-in customer's cart syncs to a second device (real cross-device persistence, not just localStorage)", async ({
  page,
  browser,
}) => {
  const email = `e2e_cart_sync_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  // A brand-new browser context has no localStorage/cookies from the
  // first -- this can only see the item if it was really persisted
  // server-side, not just written to the first context's localStorage.
  const { context: secondContext, page: secondPage } = await loginAsExisting(browser, email);
  await secondPage.goto("/cart");
  // The background sync is fire-and-forget with no client-visible
  // completion signal, and its latency is unpredictable under parallel
  // load -- poll by reloading rather than guessing a fixed wait.
  await expect(async () => {
    await secondPage.reload();
    await expect(secondPage.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await secondContext.close();
});

test("a guest's local cart merges with their server cart on login instead of replacing it", async ({
  page,
  browser,
}) => {
  const email = `e2e_cart_merge_${Date.now()}@example.com`;

  // First "device": sign up, add a frock, leave it in the server cart.
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  // Second "device": browse as a guest, add a different item, then log
  // in -- both items should end up in the cart, not just one.
  const context = await browser.newContext();
  const guestPage = await context.newPage();
  await guestPage.goto("/products/black-ruffle-seq-frock");
  await guestPage.getByRole("radio", { name: "5", exact: true }).click();
  await guestPage.getByRole("button", { name: "Add to cart" }).click();
  await expect(guestPage.getByRole("button", { name: "Added to cart" })).toBeVisible();

  await guestPage.goto("/account/login");
  await guestPage.getByPlaceholder("Email", { exact: true }).fill(email);
  await guestPage.getByPlaceholder("Password", { exact: true }).fill("correct horse battery");
  await guestPage.getByRole("button", { name: "Log in" }).click();
  await guestPage.waitForURL(/\/account$/);

  await guestPage.goto("/cart");
  // The first "device"'s sync to the server is fire-and-forget with no
  // client-visible completion signal and unpredictable latency under
  // parallel load -- poll by reloading rather than guessing a fixed wait.
  await expect(async () => {
    await guestPage.reload();
    await expect(guestPage.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible({ timeout: 2000 });
    await expect(guestPage.getByText("BLACK RUFFLE SEQ FROCK")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await context.close();
});
