import { expect, test } from "@playwright/test";

// Runs under both the mobile-ios (iPhone 13/WebKit) and mobile-android
// (Pixel 7/Chromium) Playwright projects -- see playwright.config.ts.
// Real touch emulation (viewport, touch events, user agent) catches what
// the desktop e2e suite can't: the mobile menu, tap-sized controls, and
// iOS's zoom-on-focus behavior.

test("no page requires horizontal scrolling", async ({ page }) => {
  for (const path of ["/", "/shop/frocks", "/products/blue-frock-with-big-bow-on-shoulder", "/checkout"]) {
    // Next's dev server lazily compiles a route on its first visit, which
    // can trigger a Fast Refresh reload that races with this navigation
    // and aborts it (dev-only; doesn't happen against a production
    // build) -- retry once rather than flake on that.
    try {
      await page.goto(path);
    } catch {
      await page.goto(path);
    }
    const overflowsBy = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflowsBy, `${path} should not overflow horizontally`).toBeLessThanOrEqual(2);
  }
});

test("the mobile hamburger menu opens, navigates by tap, and closes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation").filter({ hasText: "Franchise" })).toBeHidden();

  await page.getByRole("button", { name: "Open menu" }).tap();
  const mobileNav = page.getByRole("navigation").filter({ hasText: "Franchise" });
  await expect(mobileNav).toBeVisible();

  await mobileNav.getByRole("link", { name: "Accessories (Bags)" }).tap();
  await expect(page).toHaveURL(/\/shop\/bags$/);
  await expect(mobileNav).toBeHidden();
});

test("the announcement bar's prev/next controls respond to a tap without misfiring", async ({ page }) => {
  await page.goto("/");
  const bar = page.getByRole("region", { name: "Announcement" });
  await expect(bar).toContainText("FLAT 5% OFF ON SIGNING UP WITH BEAUTIFUL MESS");

  await page.getByRole("button", { name: "Next announcement" }).tap();
  await expect(bar).toContainText("STYLED OVER 20,000 + LILL ANGLES");
});

test("can select a size, add to cart, and reach checkout entirely by tap", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).tap();
  await page.getByRole("button", { name: "Add to cart" }).tap();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  await page.getByLabel("Cart, 1 items").tap();
  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("link", { name: "Checkout" }).tap();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("a product accordion (Shipping) expands on tap", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  const details = page.locator("details", { hasText: "Shipping" }).first();
  await expect(details).toHaveJSProperty("open", false);
  await details.locator("summary").tap();
  await expect(details).toHaveJSProperty("open", true);
});

test("form fields use a 16px font so iOS does not auto-zoom on focus", async ({ page }) => {
  await page.goto("/account/login");
  const emailInput = page.getByPlaceholder("Email", { exact: true });
  const fontSize = await emailInput.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fontSize).toBe("16px");
});
