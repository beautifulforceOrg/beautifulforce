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

`Product`, `Customer`, `Order`, `OrderItem`. `Order.gatewayOrderId` is
unique at the database level -- it is the same key `packages/payments`
webhook handler uses to guarantee idempotency, so a duplicate can't slip in
even if application logic has a bug.
