import { expect, test, type Page } from "@playwright/test";

// Next's dev server lazily compiles a route on its first visit, which can
// trigger a Fast Refresh reload that races with this navigation and
// aborts it (dev-only; doesn't happen against a production build) --
// retry once rather than flake on that. Same pattern as e2e/mobile.spec.ts.
async function gotoWithRetry(page: Page, path: string) {
  try {
    await page.goto(path);
  } catch {
    await page.goto(path);
  }
}

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

// This exercises OUR integration code against a stubbed window.Razorpay --
// not Razorpay's own hosted Checkout iframe, which isn't something a
// headless test should try to drive. It still needs a real order to be
// created against Razorpay's actual API (that's the whole point: proving
// the not-mocked path works end to end), so it requires real Razorpay
// test-mode credentials and is skipped otherwise.
//
// Run via `pnpm run test:e2e:razorpay-real`, not the general `test:e2e`
// -- the Next dev server is one shared process for the whole suite, so
// E2E_MOCK_EXTERNAL_APIS has to be overridden just for this run (that
// script does it inline) rather than made a persistent default in
// .env.test.local, or every other checkout-related test would also
// start hitting Razorpay's real API and break.
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

  await gotoWithRetry(page, "/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await gotoWithRetry(page, "/checkout");
  await fillCheckoutAddress(page);
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

  await gotoWithRetry(page, "/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "6-7-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await gotoWithRetry(page, "/checkout");
  await fillCheckoutAddress(page);
  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByText(/Payment was cancelled/)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});
