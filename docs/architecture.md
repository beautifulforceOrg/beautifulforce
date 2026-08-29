# Storeforge Architecture & Code Flow

This is the authoritative source for the diagrams below. See `CLAUDE.md`
for the rule that keeps it in sync with the code, and for the published
Artifact URL if one exists.

## 1. High-level system

```mermaid
graph LR
  Customer((Customer browser))

  subgraph App["apps/* (one Next.js app per storefront)"]
    Pages[Pages / Server Components]
    Actions[Server actions]
    Webhooks[Webhook routes]
  end

  subgraph Shared["packages/*"]
    UI[ui]
    DB[db]
    Payments[payments]
    Shipping[shipping]
    Config[config]
  end

  Postgres[("Postgres\n(one database per storefront)")]
  Razorpay[["Razorpay API"]]
  Shiprocket[["Shiprocket API"]]

  Customer --> Pages
  Pages --> UI
  Pages --> DB
  Actions --> Payments
  Actions --> DB
  Webhooks --> Payments
  Webhooks --> Shipping
  Webhooks --> DB
  DB --> Postgres
  Payments --> Razorpay
  Shipping --> Shiprocket
  Razorpay -.webhook.-> Webhooks
  Shiprocket -.webhook.-> Webhooks
  Config -.shared config.-> UI
  Config -.shared config.-> DB
  Config -.shared config.-> Payments
  Config -.shared config.-> Shipping
  Config -.shared config.-> App
```

## 2. Package dependency graph

Who imports whom (build-time, not runtime). `packages/config` sits under
everything; `packages/db` is the only shared package `payments`/`shipping`
depend on.

```mermaid
graph BT
  config["packages/config"]
  db["packages/db"]
  ui["packages/ui"]
  payments["packages/payments"]
  shipping["packages/shipping"]
  template["apps/_template"]
  beautifulmess["apps/beautifulmess"]

  db --> config
  ui --> config
  payments --> config
  payments --> db
  shipping --> config
  shipping --> db
  template --> config
  template --> db
  template --> ui
  template --> payments
  template --> shipping
  beautifulmess --> config
  beautifulmess --> db
  beautifulmess --> ui
  beautifulmess --> payments
  beautifulmess --> shipping
```

## 3. Purchase flow (generic, any storefront app)

```mermaid
sequenceDiagram
  participant C as Customer
  participant App as Storefront app
  participant DB as Postgres (packages/db)
  participant RP as Razorpay
  participant SR as Shiprocket

  C->>App: Browse catalog, add to cart (localStorage)
  C->>App: Checkout -> placeOrder()
  App->>RP: create order (skipped for a synthetic id under E2E_MOCK_EXTERNAL_APIS)
  RP-->>App: gatewayOrderId
  App->>DB: Order.create(status=PENDING, items)
  App-->>C: redirect to /orders/:gatewayOrderId

  RP->>App: webhook: payment.captured
  App->>App: verifyRazorpaySignature()
  App->>DB: Order.update(status=PAID) -- idempotent
  App-->>RP: 200

  SR->>App: webhook: courier status update
  App->>DB: Order.update(status=FULFILLED) -- only for mapped statuses
  App-->>SR: 200

  C->>App: reload /orders/:gatewayOrderId
  App->>DB: Order.findUnique()
  App-->>C: CheckoutSteps + status
```

**Two webhook compositions exist**, both documented in code where they
differ:

- `packages/payments`' own default `POST` handler *creates* the order row
  lazily, on the webhook, and relies on `Order.gatewayOrderId`'s unique
  constraint (P2002) for idempotency. This is what a storefront gets by
  re-exporting `POST` from `@storeforge/payments` directly.
- `apps/_template` and `apps/beautifulmess` instead pre-create the order at
  `PENDING` when checkout starts, so their own webhook routes compose
  `verifyRazorpaySignature` with an `updateMany({ where: { status:
  "PENDING" } })` instead -- idempotent because a redelivery finds no
  matching row to update. See `app/api/webhooks/razorpay/route.ts` in
  either app.

`packages/shipping`'s handler always updates (never creates), so it
composes with either model unchanged.

## 4. `packages/db` schema

```mermaid
erDiagram
  Product ||--o{ ProductVariant : has
  Product ||--o{ ProductImage : has
  Product }o--o{ Collection : "belongs to"
  Product ||--o{ OrderItem : "ordered as"
  Product ||--o{ WishlistItem : "saved as"
  Product ||--o{ Review : "reviewed as"
  ProductVariant ||--o{ OrderItem : "ordered as (optional)"
  Order ||--o{ OrderItem : contains
  Customer ||--o{ Order : places
  Customer ||--o{ WishlistItem : saves
  Customer ||--o{ Review : writes
  NewsletterSubscriber {
    string email
  }
  ContactMessage {
    string name
    string email
    string comment
  }
```

`NewsletterSubscriber` and `ContactMessage` are intentionally standalone
(no relation to `Customer`) -- the footer newsletter form and the Help >
Contact page's form are both anonymous, no account required. They
replace what were previously `action="mailto:..."` forms, which don't
reliably work across browsers and never stored a submission anywhere;
see `apps/beautifulmess/lib/newsletter-actions.ts` and
`contact-actions.ts`.

`Customer.passwordHash` (nullable) and `WishlistItem` support an
account/login feature -- the actual password hashing, session handling,
and account pages are app-local (an app that wants accounts builds its
own `lib/auth.ts`), only this storage shape is shared. See
`packages/db/README.md`.

`ProductVariant`, `ProductImage`, and `Collection` were added onboarding
the first real client (Beautiful Mess) -- all optional/empty-by-default,
so a single-variant, single-image product still behaves like the original
shape. See `packages/db/README.md`.

`Review` (one per customer per product, requires an account) supports a
product-detail "Customer Reviews" section -- starts empty for a migrated
catalog rather than backfilled with invented reviews. `ProductVariant`
also gained a nullable `stockQty` (null = untracked/unlimited, 0 = sold
out) so a storefront can optionally import real inventory data. See
`packages/db/README.md`.

## 5. `packages/ui` theming flow

```mermaid
graph LR
  Theme["StorefrontTheme object\n(colors, fonts, radius, logo)"] --> Provider[ThemeProvider]
  Provider -->|sets CSS variables| Wrapper["Wrapping &lt;div&gt; style"]
  Wrapper --> Tailwind["Tailwind tokens\nbg-brand, font-heading, ..."]
  Tailwind --> Components["Button, ProductGrid, CartSummary,\nCheckoutSteps, VariantPicker"]
```

No component reads a color/font literal directly -- swapping the theme
object is the entire branding surface. Enforced by
`packages/ui/src/theme/theme-provider.test.tsx`, which renders `Button`
under two unrelated themes and asserts identical output.

## 6. `packages/payments` webhook idempotency (default handler)

```mermaid
sequenceDiagram
  participant RP as Razorpay
  participant Route as POST /api/webhooks/razorpay (package default)
  participant DB as Postgres

  RP->>Route: payment.captured, order_id=X (1st delivery)
  Route->>DB: Order.create({gatewayOrderId: X, status: PAID})
  DB-->>Route: created

  RP->>Route: payment.captured, order_id=X (redelivered)
  Route->>DB: Order.create({gatewayOrderId: X, status: PAID})
  DB-->>Route: P2002 unique violation
  Route->>Route: treat as already-processed, no error
```

## 7. `packages/shipping` status mapping

```mermaid
graph LR
  Webhook["Shiprocket webhook\ncurrent_status"] --> Map{STATUS_MAP}
  Map -->|DELIVERED| Fulfilled["Order.status = FULFILLED"]
  Map -->|CANCELED / CANCELLED| Cancelled["Order.status = CANCELLED"]
  Map -->|anything else, e.g. IN TRANSIT| NoOp["Acknowledged 200, no DB write"]
```

## 8. `apps/beautifulmess` catalog import pipeline

```mermaid
graph LR
  CSV["data/shopify-export/products_export_1.csv"] --> Parse["parseProducts()\ncsv-parse"]
  Parse --> Group["Group rows by Handle"]
  Group --> Resolve["Resolve the product-level\nOption1 Name across rows\n(Shopify only sets it on row 1)"]
  Resolve --> Category["Map Product Category\nto a Collection"]
  Category --> Upsert["db.product.upsert()\n+ variants + images"]
  Upsert --> DB[("beautifulmess" database)]
```

## 9. CI pipeline

```mermaid
graph TD
  PR[Pull request] --> Lint[lint]
  Lint --> Type[typecheck]
  Type --> Unit[unit tests]
  Unit --> Integration["integration tests\n(real Postgres service)"]
  Integration --> E2E["e2e tests\n(real Chromium)"]
  E2E --> Secrets[gitleaks]
```

Scoped to the PR's changed packages via
`--filter=...[origin/<base-branch>]` on `pull_request`; runs unfiltered on
a direct push to `main`. See `.github/workflows/ci.yml`.
