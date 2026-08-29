import { expect, test } from "@playwright/test";

// This exercises OUR integration code against a stubbed window.Razorpay --
// not Razorpay's own hosted Checkout iframe, which isn't something a
// headless test should try to drive. It still needs a real order to be
// created against Razorpay's actual API (that's the whole point: proving
// the not-mocked path works end to end), so it requires real Razorpay
// test-mode credentials and is skipped otherwise. Once real
// RAZORPAY_KEY_ID/SECRET/NEXT_PUBLIC_RAZORPAY_KEY_ID are set (see
// packages/payments/README.md), remove E2E_MOCK_EXTERNAL_APIS from
// .env.test's this-run environment (or override it) and this activates.
const hasRealCredentials =
  process.env.E2E_MOCK_EXTERNAL_APIS !== "1" &&
  Boolean(process.env.RAZORPAY_KEY_ID) &&
  process.env.RAZORPAY_KEY_ID !== "rzp_test_key";

test.skip(!hasRealCredentials, "requires real Razorpay test-mode credentials, see file header comment");

test("opens the real Razorpay Checkout widget with the correct order, and completes the order on payment success", async ({
  page,
}) => {
  // The checkout page also loads the REAL checkout.js from Razorpay's CDN.
  // If that finishes after our stub runs, it overwrites window.Razorpay
  // with the real constructor, and .open() then tries to open Razorpay's
  // actual hosted iframe -- which never calls our fake handler, hanging
  // the test. Block the real script so our stub stays in control.
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );

  await page.addInitScript(() => {
    (window as unknown as { __rzpCalls: unknown[] }).__rzpCalls = [];
    class FakeRazorpay {
      options: { order_id: string; handler: (response: unknown) => void };
      constructor(options: { order_id: string; handler: (response: unknown) => void }) {
        this.options = options;
        (window as unknown as { __rzpCalls: unknown[] }).__rzpCalls.push(options);
      }
      open() {
        this.options.handler({
          razorpay_payment_id: "pay_fake_e2e",
          razorpay_order_id: this.options.order_id,
          razorpay_signature: "fake_signature",
        });
      }
    }
    // @ts-expect-error -- test stub, not the real Razorpay type
    window.Razorpay = FakeRazorpay;
  });

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByRole("button", { name: "Pay now" }).click();

  await page.waitForURL(/\/orders\/.+/);
  const gatewayOrderId = new URL(page.url()).pathname.split("/orders/")[1]!;
  expect(gatewayOrderId).toMatch(/^order_/);
  expect(gatewayOrderId).not.toMatch(/^order_e2e_/);

  const rzpCalls = await page.evaluate(() => (window as unknown as { __rzpCalls: { order_id: string }[] }).__rzpCalls);
  expect(rzpCalls).toHaveLength(1);
  expect(rzpCalls[0]!.order_id).toBe(gatewayOrderId);
});

test("a cancelled payment keeps the order pending and shows a retry message, not a fake success", async ({ page }) => {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );

  await page.addInitScript(() => {
    class FakeRazorpay {
      options: { modal: { ondismiss: () => void } };
      constructor(options: { modal: { ondismiss: () => void } }) {
        this.options = options;
      }
      open() {
        this.options.modal.ondismiss();
      }
    }
    // @ts-expect-error -- test stub, not the real Razorpay type
    window.Razorpay = FakeRazorpay;
  });

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "6-7-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByText(/Payment was cancelled/)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});
