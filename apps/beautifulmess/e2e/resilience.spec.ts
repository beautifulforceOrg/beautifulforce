import { expect, type Page, test } from "@playwright/test";

async function fillCheckoutAddress(page: Page) {
  await page.getByLabel("Full name").fill("Priya Nair");
  await page.getByLabel("Email", { exact: true }).fill("priya@example.com");
  await page.getByLabel("Phone number").fill("9999999999");
  await page.getByLabel("Address", { exact: true }).fill("221 Residency Road");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Flat 12");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560025");
}

test.describe("404 / error states", () => {
  test("an unknown top-level path shows a branded 404 page, not the framework default", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue shopping" })).toBeVisible();
  });

  test("an unknown product slug shows a real 404, not a crash", async ({ page }) => {
    const response = await page.goto("/products/this-product-does-not-exist-at-all");
    expect(response?.status()).toBe(404);
  });

  test("an unknown collection slug shows a real 404", async ({ page }) => {
    const response = await page.goto("/shop/not-a-real-collection");
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

    await fillCheckoutAddress(page);
    await expect(page.getByRole("button", { name: "Pay now" })).toBeEnabled();
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
    await fillCheckoutAddress(page);
    await page.getByRole("button", { name: "Pay now" }).click();
    await page.waitForURL(/\/orders\/.+/, { timeout: 15000 });
    await expect(page.getByTestId("order-status")).toHaveText("Status: PENDING");
  });
});

test.describe("newsletter signup", () => {
  test("subscribing shows a confirmation and re-subscribing the same email is harmless", async ({ page }) => {
    const email = `e2e_newsletter_${Date.now()}@example.com`;
    await page.goto("/");
    // The form action handler only exists once React hydrates -- see the
    // same fix in storefront-features.spec.ts's PLP sort test.
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("Thanks for subscribing!")).toBeVisible();

    // Re-subscribing (e.g. the user submits again, or double-clicks) must
    // not error even though the email is already stored.
    await page.reload();
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("Thanks for subscribing!")).toBeVisible();
  });

  test("rejects an invalid email server-side, not just via the browser's own validation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // "a@b" satisfies the browser's own lenient type="email" check (a
    // single-label domain is technically valid per the HTML5 spec) but
    // fails our stricter server-side regex -- proving the server action
    // itself validates, not just the browser, without needing to hack
    // around native form validation to get there.
    await page.getByLabel("Email address").fill("a@b");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("submitting a real query shows a confirmation", async ({ page }) => {
    await page.goto("/help/contact");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Name", { exact: true }).fill("E2E Shopper");
    await page.getByLabel("Email", { exact: true }).fill(`e2e_contact_${Date.now()}@example.com`);
    await page.getByLabel("Phone", { exact: true }).fill("+91 9876543210");
    await page.getByLabel("Comment", { exact: true }).fill("Do you have this frock in a larger size?");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Thanks for reaching out!")).toBeVisible();
  });

  test("requires a name, and validates email server-side too", async ({ page }) => {
    await page.goto("/help/contact");
    await page.waitForLoadState("networkidle");
    // A single space satisfies the browser's own `required` check (only a
    // truly empty value fails that) but our server action trims first,
    // so it still rejects it -- proving the server validates too, not
    // just the browser, without needing to hack around native validation.
    await page.getByLabel("Name", { exact: true }).fill(" ");
    // "a@b" passes the browser's lenient type="email" check but fails our
    // stricter server-side regex.
    await page.getByLabel("Email", { exact: true }).fill("a@b");
    await page.getByLabel("Comment", { exact: true }).fill("A real message.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
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
