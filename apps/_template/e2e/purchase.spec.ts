import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_WEBHOOK_TOKEN!;

test("customer can browse, check out, and see payment + fulfillment reflected", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.getByText("Sample Item")).toBeVisible();

  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.goto("/cart");
  await expect(page.getByText("Subtotal")).toBeVisible();

  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);

  const gatewayOrderId = new URL(page.url()).pathname.split("/orders/")[1]!;
  await expect(page.getByTestId("order-status")).toHaveText("Status: PENDING");

  // Simulate Razorpay's webhook confirming payment -- the same real route
  // the payment gateway would call in production.
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

  // Simulate Shiprocket's webhook confirming delivery.
  const deliveryResponse = await request.post(`${baseURL}/api/webhooks/shiprocket`, {
    headers: { "x-api-key": SHIPROCKET_TOKEN },
    data: JSON.stringify({ awb: "AWB_E2E", current_status: "DELIVERED", order_id: gatewayOrderId }),
  });
  expect(deliveryResponse.ok()).toBe(true);

  await page.reload();
  await expect(page.getByTestId("order-status")).toHaveText("Status: FULFILLED");
});
