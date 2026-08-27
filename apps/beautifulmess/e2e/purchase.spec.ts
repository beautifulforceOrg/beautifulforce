import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN!;

test("customer can browse the real catalog, pick a size, check out, and see fulfillment reflected", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await expect(page.getByRole("heading", { name: "BEIGE SLEEVELESS 3D FLORAL FROCK" })).toBeVisible();

  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("5-6-years")).toBeVisible();

  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

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

  const deliveryResponse = await request.post(`${baseURL}/api/webhooks/shiprocket`, {
    headers: { "x-api-key": SHIPROCKET_TOKEN },
    data: JSON.stringify({ awb: "AWB_E2E", current_status: "DELIVERED", order_id: gatewayOrderId }),
  });
  expect(deliveryResponse.ok()).toBe(true);

  await page.reload();
  await expect(page.getByTestId("order-status")).toHaveText("Status: FULFILLED");
});

test("every header and footer link resolves, not a dead link", async ({ page }) => {
  await page.goto("/");

  const hrefs = await page.locator("a[href^='/']").evaluateAll((links) =>
    Array.from(new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")))).filter(
      (href): href is string => Boolean(href)
    )
  );

  expect(hrefs.length).toBeGreaterThan(5);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});
