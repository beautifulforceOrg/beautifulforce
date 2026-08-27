# apps/_template

The reference storefront. It exists to prove `packages/*` actually work
together, not as a real client's app -- it's the fork point for a real
`apps/<client>` once it does.

Every screen is wired to a real shared package: `@storeforge/ui` for cart
and checkout components with its own theme (`app/layout.tsx`) proving no
component hardcodes branding, `@storeforge/db` for the schema template,
`@storeforge/payments` and `@storeforge/shipping` for the two webhook
routes.

## Local development

```bash
pnpm --filter @storeforge/db run db:up      # start local Postgres, once
pnpm --filter @storeforge/db run db:push    # sync the schema
pnpm --filter @storeforge/db run db:seed    # seed "Sample Item"
pnpm --filter @storeforge/template-storefront run dev
```

## e2e

`pnpm --filter @storeforge/template-storefront run test:e2e` runs the full
purchase flow: browse → add to cart → checkout → an order created at
PENDING → Razorpay's `payment.captured` webhook delivered to the real route
→ status flips to PAID → Shiprocket's `DELIVERED` webhook delivered to the
real route → status flips to FULFILLED. `E2E_MOCK_EXTERNAL_APIS=1`
(`.env.test`) is read in exactly one place, `lib/actions.ts`, to skip the
one real outbound call (creating a Razorpay order) rather than making one
in a test run -- `createRazorpayOrderFromEnv` itself is already covered by
packages/payments' own MSW-mocked unit tests. Everything downstream of
that -- both webhook routes, the database, every other shared-package
function -- runs for real. (An earlier version of this mock lived in a
`instrumentation.ts` MSW server; that hit a real incompatibility between
`msw`'s subpath exports and Next's webpack bundling of the instrumentation
hook, so the mock moved to this one call site instead.)

An a11y check (`e2e/a11y.spec.ts`) runs against the home page with
`@axe-core/playwright`.

## Order lifecycle note

This app pre-creates its `Order` row at `PENDING` when checkout starts,
then updates it to `PAID` on the webhook -- a different composition than
`packages/payments`' default (which creates the row lazily on the
webhook). See the comments in `app/api/webhooks/razorpay/route.ts` and
`lib/actions.ts` for why, and `packages/payments/README.md` for the
package's own default pattern.
