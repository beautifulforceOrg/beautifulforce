# @storeforge/db

The shared Prisma schema **template** -- not a shared database. Every
storefront copies `prisma/schema.prisma` into its own app and extends it
with client-specific fields or models locally; core entities that belong to
every storefront (a fixed relation, a new required core field) land here
first and get re-copied outward.

## Local development

```bash
pnpm run db:up        # start a local Postgres via docker-compose
pnpm run db:migrate:dev   # create/apply a migration against it (interactive)
pnpm run db:seed      # idempotent seed data
pnpm run test         # runs db:push against the test DB, then the integration suite
pnpm run db:down      # tear down the container and its volume
```

`.env.test` pins the local Postgres credentials used by every script above
-- it is not a secret, it only matches `docker-compose.yml`.

## Shadow-DB safety

`prisma migrate dev` diffs the schema against a shadow database and refuses
to apply a change that would drop or truncate existing data outside of an
interactive confirmation. This was verified directly: removing a required
column from a table with a seeded row produced

```
⚠️  Warnings for the current datasource:
  • You are about to drop the column `name` on the `Product` table, which still contains 1 non-null values.
Error: Prisma Migrate has detected that the environment is non-interactive, which is not supported.
```

i.e. it hard-stops rather than silently applying the change -- exactly the
guardrail an AI agent making unsupervised schema changes depends on.

## Core entities

`Product`, `ProductVariant`, `ProductImage`, `Collection`, `Customer`,
`WishlistItem`, `Review`, `NewsletterSubscriber`, `ContactMessage`,
`Order`, `OrderItem`. `Order.gatewayOrderId` is unique at
the database level -- it is the same key `packages/payments`' webhook
handler uses to guarantee idempotency, so a duplicate can't slip in even
if application logic has a bug.

`ProductVariant` and `ProductImage` were added while onboarding the first
real client (a catalog with real size variants and multi-image galleries)
-- both fields are optional/empty-by-default, so a product with neither
still behaves exactly like the original single-variant, single-image
shape. `OrderItem.variantId` is nullable for the same reason.
`Collection` is a plain name + product list; anything more specific than
that belongs in a storefront's own app, not here.

`Customer.passwordHash` and `WishlistItem` were added for the same
client's account/login feature -- `passwordHash` is nullable, since a
`Customer` can still exist as just an order's contact (guest checkout)
without ever having an account. The actual password hashing, session
handling, and account pages are app-local
(`apps/beautifulmess/lib/auth.ts`), not here -- only the storage shape
that any future storefront wanting accounts would also need is shared.

`Review` (one per customer per product, `@@unique([customerId, productId])`)
supports a product-detail "Customer Reviews" section for the same client
-- starts empty for a migrated catalog rather than backfilled with
invented reviews. `ProductVariant.stockQty` (nullable, added at the same
time) lets a storefront optionally import real inventory data: `null`
means untracked/unlimited (the default), `0` means sold out.

`NewsletterSubscriber` and `ContactMessage` back the footer newsletter
form and the Help > Contact page's form -- both anonymous, no relation
to `Customer`. They replace `action="mailto:..."` forms, which don't
reliably work across browsers and never stored a submission anywhere.
