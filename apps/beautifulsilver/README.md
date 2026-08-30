# apps/beautifulsilver

Storeforge's second real client: **Beautiful Silver** (`beautifulsilver.in`),
a fictional sterling-silver jewellery store. Unlike `apps/beautifulmess`
(migrated from a real Shopify store), Beautiful Silver never had an external
source of truth -- it exists specifically to prove that a brand-new
storefront can be stood up from nothing but `apps/_template` and the shared
`packages/*` core, with no changes required to any other app or package.

## What's real vs. what's invented

- **Invented**: all 20 products, their names, descriptions, prices, variants
  (ring sizes, chain/anklet lengths), and their 5 collections (Rings, Chains
  & Necklaces, Earrings, Bangles & Bracelets, Anklets) -- written directly
  into `scripts/seed-catalog.ts`, since there is no real catalog export to
  migrate.
- **Stock photography, not real product shoots**: each product's images are
  free-to-use Unsplash photos, hotlinked directly (no ImageKit account --
  see "Images" below).
- **Real**: the theme (`app/layout.tsx`), page structure, cart, checkout,
  and both webhook routes are wired to the same shared packages every other
  storefront uses (`@storeforge/ui`, `@storeforge/db`, `@storeforge/payments`,
  `@storeforge/shipping`) -- nothing here is mocked or storefront-specific
  at the package level.

## Schema

No schema changes were needed. `Product`, `ProductVariant`, `ProductImage`,
and `Collection` already exist generically in
`packages/db/prisma/schema.prisma` (added for `apps/beautifulmess`) and this
app just uses them, pointing its own scripts at that shared schema file by
relative path (see `package.json`'s `db:push`/`db:generate`/`postinstall`).

## Images

Beautiful Mess re-hosts real product photos on a client-owned ImageKit
account (`scripts/migrate-images-to-imagekit.ts`). Beautiful Silver has no
real photography to re-host, so `scripts/seed-catalog.ts` references
Unsplash's stock photo CDN directly instead -- no ImageKit account needed
for this storefront. `next.config.mjs` allowlists `images.unsplash.com` as
a remote image host.

## Local development

```bash
pnpm --filter @storeforge/db run db:up             # start local Postgres, once
pnpm --filter @storeforge/beautifulsilver run db:push
pnpm --filter @storeforge/beautifulsilver run seed:catalog
pnpm --filter @storeforge/beautifulsilver run dev
```

Uses its own database (`beautifulsilver`, see `.env.test`'s `DATABASE_URL`)
in the same local Postgres container `packages/db` starts -- isolated from
`beautifulmess`'s and `template`'s own databases, matching CLAUDE.md's
per-storefront isolation rule.

## e2e

`pnpm --filter @storeforge/beautifulsilver run test:e2e` runs the full
purchase flow against the real seeded catalog: browse a collection → view a
product → select a variant → add to cart → checkout → an order created at
PENDING → Razorpay's `payment.captured` webhook → PAID → Shiprocket's
`DELIVERED` webhook → FULFILLED, plus 404 and full-catalog-reachability
checks. `e2e/a11y.spec.ts` checks the home and a product page with
`@axe-core/playwright`. Same `E2E_MOCK_EXTERNAL_APIS=1` convention as
`apps/_template` to skip the one real outbound Razorpay-order-creation call.
