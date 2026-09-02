import { expect, test } from "@playwright/test";

test("a product page has its own title and meta description, not the site-wide default", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await expect(page).toHaveTitle(/BEIGE SLEEVELESS 3D FLORAL FROCK.*Beautiful Mess/i);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).not.toBe("Playful, elegant kidswear and accessories from Beautiful Mess.");
  expect(description?.length).toBeGreaterThan(0);
});

test("a collection page has its own title, not the site-wide default", async ({ page }) => {
  await page.goto("/shop/frocks");
  await expect(page).toHaveTitle(/Beautiful Mess/);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).not.toBe("Playful, elegant kidswear and accessories from Beautiful Mess.");
});

test("the homepage still uses the site-wide default title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Beautiful Mess");
});

test("sitemap.xml lists real product and collection URLs", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain("/products/beige-sleeveless-3d-floral-frock");
  expect(body).toContain("/shop/frocks");
});

test("robots.txt disallows account/checkout/admin and points at the sitemap", async ({ page }) => {
  const response = await page.goto("/robots.txt");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain("Disallow: /account");
  expect(body).toContain("Disallow: /checkout");
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain("Sitemap:");
});
