import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN!;

test("customer can browse a collection, view a product, select a variant, check out, and see payment + fulfillment reflected", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Beautiful Silver" })).toBeVisible();

  await page.goto("/collections/rings");
  await expect(page.getByRole("heading", { name: "Rings" })).toBeVisible();
  await page.getByRole("link", { name: /Woven Wave Band Ring/ }).click();
  await expect(page).toHaveURL(/\/products\/woven-wave-band-ring$/);

  await page.getByRole("radio", { name: "US 6" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  await page.getByRole("link", { name: /Cart/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText("Woven Wave Band Ring")).toBeVisible();
  await expect(page.getByText("Ring Size: US 6")).toBeVisible();

  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Phone number").fill("9999999999");
  await page.getByLabel("Address", { exact: true }).fill("12 MG Road");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Flat 4B");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560001");

  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);

  const gatewayOrderId = new URL(page.url()).pathname.split("/orders/")[1]!;
  await expect(page.getByTestId("order-status")).toHaveText("Status: PENDING");

  const capturedPayload = {
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_e2e", order_id: gatewayOrderId } } },
  };
  const capturedBody = JSON.stringify(capturedPayload);
  const capturedSignature = createHmac("sha256", RAZORPAY_SECRET).update(capturedBody).digest("hex");

  const paymentResponse = await request.post(`${baseURL}/api/webhooks/razorpay`, {
    headers: { "x-razorpay-signature": capturedSignature },
    data: capturedBody,
  });
  expect(paymentResponse.ok()).toBe(true);

  await page.reload();
  await expect(page.getByTestId("order-status")).toHaveText("Status: PAID");
  // A shipment is created (mocked under E2E_MOCK_EXTERNAL_APIS) the moment
  // payment is captured -- see lib/shipping.ts and the razorpay webhook.
  await expect(page.getByTestId("order-tracking")).toContainText("AWB_E2E_MOCK");

  const deliveryResponse = await request.post(`${baseURL}/api/webhooks/shiprocket`, {
    headers: { "x-api-key": SHIPROCKET_TOKEN },
    data: JSON.stringify({ awb: "AWB_E2E", current_status: "DELIVERED", order_id: gatewayOrderId }),
  });
  expect(deliveryResponse.ok()).toBe(true);

  await page.reload();
  await expect(page.getByTestId("order-status")).toHaveText("Status: FULFILLED");
});

test("an unknown product or collection slug shows a real 404", async ({ page }) => {
  const productResponse = await page.goto("/products/this-does-not-exist");
  expect(productResponse?.status()).toBe(404);

  const collectionResponse = await page.goto("/collections/this-does-not-exist");
  expect(collectionResponse?.status()).toBe(404);
});

test("all 20 seeded products are reachable across their collections", async ({ page }) => {
  const collections = ["rings", "chains-and-necklaces", "earrings", "bangles-and-bracelets", "anklets"];
  for (const slug of collections) {
    await page.goto(`/collections/${slug}`);
    const productLinks = page.locator("a[href^='/products/']");
    await expect(productLinks).toHaveCount(4);
  }
});
