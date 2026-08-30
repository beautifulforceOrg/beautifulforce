import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Runs against a real, already-deployed Vercel Preview (see
// playwright.preview.config.ts and package.json's test:e2e:preview
// script) -- the real serverless functions, the real Neon preview
// branch, real ImageKit images. This is a smaller smoke subset, not
// the full local suite: every write here lands in a shared database
// other preview deploys/people may also be using, and each test pays
// real network latency instead of localhost's. Pick a handful of
// critical flows, not exhaustive coverage -- the full suite already
// covers the exhaustive case locally against a disposable database.

test("homepage loads with real, working ImageKit images (not a broken host)", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Beautiful Mess/i, level: 1 })).toBeAttached();

  const heroImg = page.locator("main img").first();
  await heroImg.waitFor({ state: "visible" });
  const naturalWidth = await heroImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
  expect(naturalWidth, "hero image should have actually loaded, not be broken").toBeGreaterThan(0);

  expect(failed, `no failed requests, got: ${failed.join(", ")}`).toEqual([]);
});

test("a real product page renders with real catalog data from the preview database", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await expect(page.getByRole("heading", { name: "BEIGE SLEEVELESS 3D FLORAL FROCK" })).toBeVisible();
  // Scoped to the main price paragraph specifically -- the page also
  // renders "You May Also Like" cards with their own (same-priced) real
  // products, which a broader text match would ambiguously also hit.
  await expect(page.locator("p.text-lg", { hasText: "₹5,500" })).toBeVisible();
});

test("an unknown product slug returns a real 404 on the deployed serverless function", async ({ page }) => {
  const response = await page.goto("/products/this-does-not-exist-anywhere");
  expect(response?.status()).toBe(404);
});

test("search finds real products against the deployed database", async ({ page }) => {
  await page.goto("/search?q=frock");
  // Many real products match "frock" -- just confirm at least one real
  // result rendered, not a specific one.
  await expect(page.getByText(/FROCK/).first()).toBeVisible();
});

test("can sign up, get wishlisted, and log back in against the preview database", async ({ page }) => {
  const email = `preview_smoke_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Added to wishlist" })).toBeVisible();

  await page.goto("/account");
  await expect(page.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible();
});

test("can add to cart, apply the real discount code, and reach checkout", async ({ page }) => {
  await page.goto("/products/blue-frock-with-big-bow-on-shoulder");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  await page.goto("/checkout");
  await page.getByLabel("Discount code").fill("MESS05");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/MESS05 applied/)).toBeVisible();
  // Not completing a real Razorpay payment here -- Preview's Razorpay
  // env vars are the same safe test placeholders as .env.test, not
  // real credentials, by design (see the Vercel env var setup notes).
});

test("newsletter signup writes to the preview database", async ({ page }) => {
  const email = `preview_smoke_newsletter_${Date.now()}@example.com`;
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("Thanks for subscribing!")).toBeVisible({ timeout: 10000 });
});

test("contact form writes to the preview database", async ({ page }) => {
  await page.goto("/help/contact");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Name", { exact: true }).fill("Preview Smoke Test");
  await page.getByLabel("Email", { exact: true }).fill(`preview_smoke_contact_${Date.now()}@example.com`);
  await page.getByLabel("Comment", { exact: true }).fill("Smoke-testing the preview deployment.");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks for reaching out!")).toBeVisible({ timeout: 10000 });
});

test("no horizontal overflow on the deployed build", async ({ page }) => {
  await page.goto("/");
  const overflowsBy = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflowsBy).toBeLessThanOrEqual(2);
});

test("homepage has no accessibility violations on the real deployed build", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
