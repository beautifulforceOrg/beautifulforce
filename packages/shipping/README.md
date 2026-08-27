# @storeforge/shipping

Shiprocket integration behind a courier-agnostic interface
(`ShippingProvider`). Consumers depend on normalized `Shipment` /
`TrackingUpdate` shapes, not Shiprocket's raw response -- swapping couriers
later means writing a new provider that implements the same interface, not
touching every call site.

## Wiring a storefront

Environment variables:

- `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` -- used by `createShiprocketProviderFromEnv`
- `SHIPROCKET_WEBHOOK_TOKEN` -- must match the "Webhook Secret" configured in the Shiprocket panel

Route handler (Next.js App Router):

```ts
// app/api/webhooks/shiprocket/route.ts
export { POST } from "@storeforge/shipping";
```

Creating a shipment after payment is captured:

```ts
import { createShiprocketProviderFromEnv } from "@storeforge/shipping";

const provider = createShiprocketProviderFromEnv();
const shipment = await provider.createShipment({ orderId, orderDate, shipTo, items });
```

## Status mapping

The webhook only writes to `Order.status` for courier statuses that map
unambiguously onto the core `OrderStatus` enum: `DELIVERED` → `FULFILLED`,
`CANCELED`/`CANCELLED` → `CANCELLED`. Everything else (`IN TRANSIT`,
`OUT FOR DELIVERY`, ...) is acknowledged with a 200 but left alone --
`packages/db`'s schema doesn't model shipment-in-flight states, and this
package shouldn't grow the core schema to fit one courier's vocabulary.

## Testing

- `shiprocket-provider.test.ts` -- mocked with MSW; `onUnhandledRequest:
  "error"` means the suite fails outright if it ever tries a real network
  call, so no live Shiprocket account is needed to run it.
- `webhook.integration.test.ts` -- runs against the same local Postgres as
  `packages/db` (see its README for `pnpm run db:up`).
