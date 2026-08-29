import { expect, test } from "@playwright/test";

test.describe("announcement bar", () => {
  test("rotates through the real messages automatically and via manual controls", async ({ page }) => {
    await page.goto("/");
    const bar = page.getByRole("region", { name: "Announcement" });
    await expect(bar).toContainText("FLAT 5% OFF ON SIGNING UP WITH BEAUTIFUL MESS");

    await page.getByRole("button", { name: "Next announcement" }).click();
    await expect(bar).toContainText("STYLED OVER 20,000 + LILL ANGLES");

    await page.getByRole("button", { name: "Previous announcement" }).click();
    await expect(bar).toContainText("FLAT 5% OFF ON SIGNING UP WITH BEAUTIFUL MESS");
  });
});

test.describe("cart login prompt", () => {
  test("prompts a signed-out visitor to log in for a faster checkout", async ({ page }) => {
    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.goto("/cart");
    const prompt = page.getByText("to check out faster.");
    await expect(prompt).toBeVisible();
    await expect(prompt.locator("..").getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/account/login"
    );
  });

  test("does not show the prompt once logged in", async ({ page }) => {
    const email = `e2e_cart_login_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);

    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.goto("/cart");
    await expect(page.getByText("to check out faster.")).not.toBeVisible();
  });
});

test.describe("search", () => {
  test("finds real products by name", async ({ page }) => {
    await page.goto("/search");
    await page.getByPlaceholder("Search products").fill("frock");
    await page.getByPlaceholder("Search products").press("Enter");
    await expect(page).toHaveURL(/\/search\?q=frock/);
    await expect(page.getByText("IVORY SEQ HEM FROCK")).toBeVisible();
  });

  test("shows a no-results message for a nonsense query", async ({ page }) => {
    await page.goto("/search?q=zzzznotarealproductzzzz");
    await expect(page.getByText(/No products found/)).toBeVisible();
  });
});

test.describe("PLP sort, filter, and count", () => {
  test("shows a real item count and sorts low to high by price", async ({ page }) => {
    await page.goto("/shop/frocks");
    await expect(page.getByText(/^\d+ items?$/)).toBeVisible();
    // The sort <select>'s onChange handler only exists once React hydrates
    // -- interacting before then can silently miss the event in some
    // browsers under dev-mode's slower, unoptimized bundle.
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Sort products").selectOption("price-ascending");
    await expect(page).toHaveURL(/sort=price-ascending/);

    const prices = await page
      .locator("main a[href^='/products/'] span", { hasText: "₹" })
      .allTextContents();
    const values = prices.map((p) => Number(p.replace(/[^\d]/g, "")));
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  test("filters to in-stock only", async ({ page }) => {
    await page.goto("/shop/frocks");
    await page.waitForLoadState("networkidle");
    const countBefore = await page.getByText(/^\d+ items?$/).textContent();

    await page.getByLabel("Filter by availability").selectOption("in-stock");
    await expect(page).toHaveURL(/availability=in-stock/);
    await expect(page.getByText(/^\d+ items?$/)).toBeVisible();
    // Every real variant in this catalog is currently in stock, so filtering
    // to in-stock-only should not change the count.
    await expect(page.getByText(/^\d+ items?$/)).toHaveText(countBefore ?? "");
  });

  test("filters by price range", async ({ page }) => {
    // Every frock in this catalog is real-priced at exactly ₹5,500 (no
    // in-collection price variety to fabricate a "narrows the results"
    // scenario against) -- so the meaningful, honest check is a boundary
    // one: a minimum above every real price excludes everything, and one
    // below it includes everything.
    await page.goto("/shop/frocks");
    await page.waitForLoadState("networkidle");
    const countBefore = await page.getByText(/^\d+ items?$/).textContent();

    await page.getByLabel("Minimum price").fill("6000");
    await page.getByLabel("Minimum price").blur();
    await expect(page).toHaveURL(/minPrice=6000/);
    await expect(page.getByText("0 items")).toBeVisible();

    await page.getByLabel("Minimum price").fill("1000");
    await page.getByLabel("Minimum price").blur();
    await expect(page).toHaveURL(/minPrice=1000/);
    await expect(page.getByText(/^\d+ items?$/)).toHaveText(countBefore ?? "");
  });
});

test.describe("hover-swap product images", () => {
  test("a multi-image catalog card swaps to its second image on hover", async ({ page }) => {
    await page.goto("/shop/frocks");
    const card = page.locator("a[href='/products/ivory-seq-hem-frock']");
    const images = card.locator("img");
    await expect(images).toHaveCount(2);
    await expect(images.nth(1)).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(images.nth(1)).toHaveCSS("opacity", "1");
  });
});

test.describe("gift card recipient fields", () => {
  test("requires a recipient email before adding a gifted card to cart", async ({ page }) => {
    await page.goto("/products/bm-gift-card");
    await page.getByRole("checkbox", { name: "Send to a friend" }).check();
    await expect(page.getByLabel("Recipient's email")).toBeVisible();

    await expect(page.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    await page.getByLabel("Recipient's email").fill("friend@example.com");
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
  });

  test("can add a gift card for yourself without recipient details", async ({ page }) => {
    await page.goto("/products/bm-gift-card");
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();
  });
});

test.describe("discount code", () => {
  test("applies MESS05 at checkout and rejects an invalid code", async ({ page }) => {
    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.goto("/checkout");
    await page.getByLabel("Discount code").fill("NOTREAL");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("That discount code isn't valid.")).toBeVisible();

    await page.getByLabel("Discount code").fill("MESS05");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/MESS05 applied/)).toBeVisible();
  });
});
