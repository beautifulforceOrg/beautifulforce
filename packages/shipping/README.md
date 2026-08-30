# @storeforge/shipping

Shiprocket integration behind a courier-agnostic interface
(`ShippingProvider`). Consumers depend on normalized `Shipment` /
`TrackingUpdate` shapes, not Shiprocket's raw response -- swapping couriers
later means writing a new provider that implements the same interface, not
touching every call site.

## Wiring a storefront

Environment variables:

- `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` -- used by `createShiprocketProviderFromEnv`
- `SHIPROCKET_PICKUP_LOCATION` -- the pickup address's exact nickname as
  configured in the Shiprocket dashboard (Settings -> Pickup Addresses).
  Shiprocket's `/orders/create/adhoc` rejects an order without a valid one.
- `SHIPROCKET_WEBHOOK_TOKEN` -- must match the "Webhook Secret" configured in the Shiprocket panel

Route handler (Next.js App Router):

```ts
// app/api/webhooks/shiprocket/route.ts
export { POST } from "@storeforge/shipping";
```

Creating a shipment after payment is captured. `packageWeightKg`/`dimensionsCm`
have no default here -- every business ships different things, so each
storefront supplies its own (see e.g. `apps/beautifulsilver/lib/shipping.ts`):

```ts
import { createShiprocketProviderFromEnv } from "@storeforge/shipping";

const provider = createShiprocketProviderFromEnv();
const shipment = await provider.createShipment({
  orderId,
  orderDate,
  shipTo, // ShipToAddress -- name, email, phone, addressLine1(+2), city, state, pincode
  items,
  packageWeightKg,
  dimensionsCm: { length, breadth, height },
});
```

`ShipToAddress` is deliberately just enough for Shiprocket's API, not a
general-purpose address model -- storefronts collect it at checkout (see
each app's `app/checkout/address-form.tsx`) and persist the fields
directly on `Order` (`packages/db`'s `shipTo*` columns) rather than a
separate `Address` model, since nothing in this repo reuses a saved
address across orders yet.

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
