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

test("a product page has canonical, Open Graph, Twitter card, and Product JSON-LD structured data", async ({
  page,
}) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/products\/beige-sleeveless-3d-floral-frock$/
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /BEIGE SLEEVELESS/i);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

  const jsonLd = await page.locator('script[type="application/ld+json"]').last().textContent();
  const data = JSON.parse(jsonLd ?? "{}");
  expect(data["@type"]).toBe("Product");
  expect(data.offers["@type"]).toBe("Offer");
  expect(data.offers.priceCurrency).toBe("INR");
  expect(["https://schema.org/InStock", "https://schema.org/OutOfStock"]).toContain(data.offers.availability);
});

test("a collection page has a canonical URL that ignores sort/filter query params", async ({ page }) => {
  await page.goto("/shop/frocks?sort=price-ascending&minPrice=1000");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop\/frocks$/);
});

test("no google-site-verification tag renders until GOOGLE_SITE_VERIFICATION is actually set", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0);
});

test("every page carries the real LocalBusiness structured data", async ({ page }) => {
  await page.goto("/");
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const localBusiness = scripts.map((s) => JSON.parse(s)).find((d) => d["@type"] === "ClothingStore");
  expect(localBusiness).toBeDefined();
  expect(localBusiness.telephone).toBe("+918088339455");
  expect(localBusiness.address.addressLocality).toBe("Bengaluru");
});
