# @storeforge/payments

Razorpay integration, written once so every storefront gets the same
idempotency guarantee on a repeated webhook delivery.

## Wiring a storefront

Environment variables:

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` -- used by `createRazorpayOrderFromEnv`
- `RAZORPAY_WEBHOOK_SECRET` -- used to verify the `x-razorpay-signature` header

Route handler (Next.js App Router):

```ts
// app/api/webhooks/razorpay/route.ts
export { POST } from "@storeforge/payments";
```

Creating an order at checkout:

```ts
import { createRazorpayOrderFromEnv, calculateCartTotal } from "@storeforge/payments";

const amount = calculateCartTotal(cartLines);
const order = await createRazorpayOrderFromEnv({ amount, receipt: cartId });
```

## Idempotency

`Order.gatewayOrderId` is unique at the database level
(`packages/db/prisma/schema.prisma`). `handlePaymentCaptured` relies on that
constraint rather than re-implementing dedup logic: a second delivery of the
same event hits Prisma error `P2002` and is treated as already-processed.
`webhook.integration.test.ts` delivers the same event twice against a real
Postgres and asserts exactly one order exists -- this is the test every
storefront inherits for free by depending on this package.

## Testing

- `pricing.test.ts` -- pure unit tests, no I/O.
- `razorpay-client.test.ts` -- mocked with MSW; `onUnhandledRequest: "error"`
  means the suite fails outright if it ever tries a real network call.
- `webhook.integration.test.ts` -- runs against the same local Postgres as
  `packages/db` (see its README for `pnpm run db:up`).
