import { expect, test } from "@playwright/test";

test.describe("header navigation", () => {
  test("Home and About Us links navigate directly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "About Us" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: "About Us" })).toBeVisible();
    // The page used to be just the heading with no body copy -- it now
    // carries the real founder story (also shown on the homepage).
    await expect(page.getByRole("heading", { name: "Anitaa Manish (Founder)" })).toBeVisible();
    await expect(page.getByText(/Beautiful Mess with a vision to blend/)).toBeVisible();

    await page.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/");
  });

  test("the Shop dropdown opens, navigates, and closes after choosing a link", async ({ page }) => {
    await page.goto("/");
    const dropdown = page.locator("details", { hasText: "Shop" }).first();

    await page.getByText("Shop", { exact: true }).click();
    await expect(dropdown).toHaveJSProperty("open", true);

    await page.getByRole("link", { name: "Apparel (Frocks)" }).click();
    await expect(page).toHaveURL(/\/shop\/frocks$/);
    await expect(dropdown).toHaveJSProperty("open", false);
  });

  test("the Help dropdown opens, navigates, and closes after choosing a link", async ({ page }) => {
    await page.goto("/");
    const dropdown = page.locator("details", { hasText: "Help" }).first();

    await page.getByText("Help", { exact: true }).click();
    await expect(dropdown).toHaveJSProperty("open", true);

    await page.getByRole("link", { name: "Career & Partnerships" }).click();
    await expect(page).toHaveURL(/\/help\/careers$/);
    await expect(dropdown).toHaveJSProperty("open", false);
  });

  test("the mobile menu opens, navigates, and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByRole("navigation").filter({ hasText: "Franchise" });
    await expect(mobileNav).toBeVisible();

    await mobileNav.getByRole("link", { name: "Accessories (Bags)" }).click();
    await expect(page).toHaveURL(/\/shop\/bags$/);
    await expect(mobileNav).toBeHidden();
  });

  test("wishlist and account icons point at the account area", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "My wishlist" })).toHaveAttribute("href", /\/account/);
    await expect(page.getByRole("link", { name: /My account|Log in/ })).toHaveAttribute("href", /\/account/);
  });
});

test.describe("footer", () => {
  test("the Terms and Policies popover opens, lists real policy links, and closes after navigating", async ({
    page,
  }) => {
    await page.goto("/");
    const popover = page.locator("details", { hasText: "Terms and Policies" });

    await page.getByText("Terms and Policies").click();
    await expect(popover).toHaveJSProperty("open", true);

    const links = ["Privacy policy", "Terms of service", "Refund policy", "Contact information", "Shipping policy"];
    for (const label of links) {
      await expect(popover.getByRole("link", { name: label })).toBeVisible();
    }

    await popover.getByRole("link", { name: "Shipping policy" }).click();
    await expect(page).toHaveURL(/\/policies\/shipping$/);
    await expect(popover).toHaveJSProperty("open", false);
  });

  test("Facebook and Instagram links point at the client's real, verified handles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Beautiful Mess on Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/beautifulmessbyann"
    );
    await expect(page.getByRole("link", { name: "Beautiful Mess on Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/beautifulmessbyann/"
    );
  });
});

test.describe("catalog and cart interactions", () => {
  test("can wishlist a product directly from the catalog grid once logged in", async ({ page }) => {
    const email = `e2e_grid_${Date.now()}@example.com`;
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);

    await page.goto("/shop/frocks");
    const firstWishlistButton = page.getByRole("button", { name: /^Add .* to wishlist$/ }).first();
    const label = await firstWishlistButton.getAttribute("aria-label");
    const productName = label!.replace(/^Add /, "").replace(/ to wishlist$/, "");

    await firstWishlistButton.click();
    const removeButton = page.getByRole("button", { name: `Remove ${productName} from wishlist` });
    await expect(removeButton).toBeVisible();

    await page.goto("/account");
    await expect(page.getByText(productName)).toBeVisible();

    // Toggling it off is the other half of this feature -- every existing
    // test only ever adds, none confirmed removal actually persists.
    await page.goto("/shop/frocks");
    await page.getByRole("button", { name: `Remove ${productName} from wishlist` }).click();
    await expect(page.getByRole("button", { name: `Add ${productName} to wishlist` })).toBeVisible();

    await page.goto("/account");
    await expect(page.getByText(productName)).not.toBeVisible();
  });

  test("cart quantity controls and remove work end to end", async ({ page }) => {
    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "6-7-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.goto("/cart");
    const quantityLabel = page.locator('span[aria-label="BEIGE SLEEVELESS 3D FLORAL FROCK quantity"]');
    await expect(quantityLabel).toHaveText("1");

    await page.getByLabel("Increase BEIGE SLEEVELESS 3D FLORAL FROCK quantity").click();
    await expect(quantityLabel).toHaveText("2");

    await page.getByLabel("Decrease BEIGE SLEEVELESS 3D FLORAL FROCK quantity").click();
    await expect(quantityLabel).toHaveText("1");

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });
});
