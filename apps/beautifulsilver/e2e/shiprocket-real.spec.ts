import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

// This exercises the REAL Shiprocket API (via lib/shipping.ts's
// createShipmentForOrder), not a mock -- it needs a real Razorpay order
// (to reach the webhook path) and a real Shiprocket account, so it's
// skipped unless both are configured. Run via
// `pnpm run test:e2e:shiprocket-real`, not the general `test:e2e`.
const hasRealCredentials =
  process.env.E2E_MOCK_EXTERNAL_APIS !== "1" &&
  Boolean(process.env.RAZORPAY_KEY_ID) &&
  process.env.RAZORPAY_KEY_ID !== "rzp_test_key" &&
  Boolean(process.env.SHIPROCKET_EMAIL);

test.skip(!hasRealCredentials, "requires real Razorpay + Shiprocket credentials, see file header comment");

const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

test("a real payment-captured webhook creates a real Shiprocket shipment for the order", async ({
  page,
  request,
  baseURL,
}) => {
  // This test is about what happens once payment is captured, not about
  // the Razorpay widget itself -- stub it the same way as
  // apps/beautifulmess/e2e/razorpay-checkout.spec.ts to skip straight to
  // a real Razorpay order id.
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );
  await page.addInitScript(() => {
    class FakeRazorpay {
      options: { order_id: string; handler: (response: unknown) => void };
      constructor(options: { order_id: string; handler: (response: unknown) => void }) {
        this.options = options;
      }
      open() {
        this.options.handler({});
      }
    }
    // @ts-expect-error -- test stub, not the real Razorpay type
    window.Razorpay = FakeRazorpay;
  });

  await page.goto("/products/woven-wave-band-ring");
  await page.getByRole("radio", { name: "US 6" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
  // NOT "9999999999" -- Shiprocket's real API rejects obviously-fake,
  // all-repeated-digit phone numbers as an invalid format.
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByLabel("Address", { exact: true }).fill("12 MG Road");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Flat 4B");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByLabel("Pincode").fill("560001");
  await page.getByRole("button", { name: "Pay now" }).click();

  await page.waitForURL(/\/orders\/.+/);
  const gatewayOrderId = new URL(page.url()).pathname.split("/orders/")[1]!;
  expect(gatewayOrderId).toMatch(/^order_/);
  expect(gatewayOrderId).not.toMatch(/^order_e2e_/);

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
  // A brand-new Shiprocket shipment has no AWB until a courier is
  // assigned -- confirmed against the real API -- so this is the
  // strongest thing to assert without a courier-assignment step.
  await expect(page.getByTestId("order-tracking")).toBeVisible();
});
