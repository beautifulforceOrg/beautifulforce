import { expect, test } from "@playwright/test";

test.describe("404 / error states", () => {
  test("an unknown product slug shows a real 404, not a crash", async ({ page }) => {
    const response = await page.goto("/products/this-product-does-not-exist-at-all");
    expect(response?.status()).toBe(404);
  });

  test("an unknown collection slug shows a real 404", async ({ page }) => {
    const response = await page.goto("/shop/not-a-real-collection");
    expect(response?.status()).toBe(404);
  });

  test("an unknown top-level path shows a real 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("keyboard-only navigation", () => {
  test("focused text inputs show a visible focus ring", async ({ page }) => {
    await page.goto("/account/login");
    const emailInput = page.getByPlaceholder("Email", { exact: true });
    await emailInput.focus();
    const outlineStyle = await emailInput.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe("none");
  });

  test("can browse, select a size, add to cart, and reach checkout using only the keyboard", async ({ page }) => {
    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.waitForLoadState("networkidle");

    // Tab to the first size radio and select it with the keyboard.
    const firstSize = page.getByRole("radio", { name: "5-6-years" });
    await firstSize.focus();
    await page.keyboard.press("Space");
    await expect(firstSize).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Add to cart" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

    await page.getByRole("link", { name: /Cart, \d+ items/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/cart$/);

    await page.getByRole("link", { name: "Checkout" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("a product accordion can be opened with the keyboard", async ({ page }) => {
    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    const details = page.locator("details", { hasText: "Shipping" }).first();
    await expect(details).toHaveJSProperty("open", false);

    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveJSProperty("open", true);
  });
});

test.describe("cart resilience without localStorage", () => {
  test("the site still renders and lets you browse if localStorage throws (e.g. Safari Private Browsing)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("localStorage disabled");
        },
      });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Beautiful Mess/i, level: 1 })).toBeAttached();

    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    // Adding to cart can't persist without storage, but it must not crash
    // the page -- the button click should complete without throwing.
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("heading", { name: "BEIGE SLEEVELESS 3D FLORAL FROCK" })).toBeVisible();
  });
});

test.describe("double-submit protection", () => {
  test("rapidly double-clicking Submit review does not create two reviews", async ({ page }) => {
    const email = `e2e_double_review_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);

    // A unique marker per run -- local Postgres isn't reset between test
    // runs/browser projects, and different customers can each legitimately
    // leave one review on the same product, so a fixed comment string
    // would accumulate matches across runs and give a false positive.
    const marker = `e2e-marker-${Date.now()}`;
    await page.goto("/products/black-ruffle-seq-frock");
    await page.getByRole("radio", { name: "5", exact: true }).check();
    await page.getByPlaceholder("Share your experience with this product").fill(`Great dress, arrived on time. ${marker}`);

    const submit = page.getByRole("button", { name: /Submit review|Submitting/ });
    await Promise.all([submit.click(), submit.click()]);

    await expect(page.getByText("You've reviewed this product. Thank you!")).toBeVisible();
    // Let the success handler's own router.refresh() settle before we
    // issue a manual reload -- racing the two can abort the reload
    // request in some browsers (a test-timing hazard, not a data bug).
    await page.waitForLoadState("networkidle");
    await page.reload();
    const reviewTexts = await page.getByText(marker).count();
    expect(reviewTexts).toBe(1);
  });
});

test.describe("slow network", () => {
  test("checkout still completes, just slower, on a throttled connection", async ({ page }) => {
    // Cross-browser way to simulate a slow connection (CDP throttling is
    // Chromium-only) -- delay every request/response by 300ms.
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });

    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible({ timeout: 15000 });

    await page.goto("/checkout");
    await page.getByRole("button", { name: "Pay now" }).click();
    await page.waitForURL(/\/orders\/.+/, { timeout: 15000 });
    await expect(page.getByTestId("order-status")).toHaveText("Status: PENDING");
  });
});

test.describe("input edge cases", () => {
  test("a very long review comment and emoji don't break the page", async ({ page }) => {
    const email = `e2e_long_review_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);

    await page.goto("/products/black-sparkle-net-frock");
    await page.getByRole("radio", { name: "4", exact: true }).check();
    const longComment = "Absolutely lovely! 🎀👗✨ ".repeat(50);
    await page.getByPlaceholder("Share your experience with this product").fill(longComment);
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText("You've reviewed this product. Thank you!")).toBeVisible();
  });

  test("special characters in the signup name don't break account creation", async ({ page }) => {
    const email = `e2e_special_name_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Name").fill("O'Brien-Müller <test> & Co.");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);
    await expect(page.getByRole("heading", { name: /Hi, O'Brien-Müller/ })).toBeVisible();
  });
});
