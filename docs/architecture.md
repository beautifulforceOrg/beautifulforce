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

A mobile client (`apps/mobile-template`, forked as `apps/beautifulmess-mobile`
for the first real client) talks to the same storefront app over a JSON
API instead of rendering its pages -- see diagram 10 for that
architecture in detail.

## 2. Package dependency graph

Who imports whom (build-time, not runtime). `packages/config` sits under
everything; `packages/db` is the only shared package `payments`/`shipping`
depend on.

```mermaid
graph BT
  config["packages/config"]
  db["packages/db"]
  ui["packages/ui"]
  uinative["packages/ui-native"]
  apiclient["packages/api-client"]
  mobileconfig["packages/mobile-config"]
  payments["packages/payments"]
  shipping["packages/shipping"]
  template["apps/_template"]
  beautifulmess["apps/beautifulmess"]
  beautifulsilver["apps/beautifulsilver"]
  mobiletemplate["apps/mobile-template"]
  beautifulmessmobile["apps/beautifulmess-mobile"]

  db --> config
  ui --> config
  uinative --> config
  apiclient --> config
  mobileconfig --> config
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
  beautifulsilver --> config
  beautifulsilver --> db
  beautifulsilver --> ui
  beautifulsilver --> payments
  beautifulsilver --> shipping
  mobiletemplate --> config
  mobiletemplate --> uinative
  mobiletemplate --> apiclient
  beautifulmessmobile --> config
  beautifulmessmobile --> uinative
  beautifulmessmobile --> apiclient
  beautifulmessmobile -.type-only, see diagram 10.-> mobileconfig
```

`packages/api-client` has no build-time dependency on `apps/beautifulmess`
(or any storefront app) -- it talks to `app/api/mobile/**` purely over
HTTP, at a base URL supplied at runtime. See diagram 10.

## 3. Purchase flow (generic, any storefront app)

```mermaid
sequenceDiagram
  participant C as Customer
  participant App as Storefront app
  participant DB as Postgres (packages/db)
  participant RP as Razorpay
  participant SR as Shiprocket

  C->>App: Browse catalog, add to cart (localStorage)
  C->>App: Checkout -> fills shipping address (AddressForm, packages/ui)
  C->>App: placeOrder(lines, address)
  App->>RP: create order (skipped for a synthetic id under E2E_MOCK_EXTERNAL_APIS)
  RP-->>App: gatewayOrderId
  App->>DB: Order.create(status=PENDING, items, shipTo*)
  App-->>C: redirect to /orders/:gatewayOrderId

  RP->>App: webhook: payment.captured
  App->>App: verifyRazorpaySignature()
  App->>DB: Order.update(status=PAID) -- idempotent
  App->>SR: createShipment(shipTo, items) -- lib/shipping.ts, skipped if no address on file
  SR-->>App: shipmentId, awbCode, courierName
  App->>DB: Order.update(shipmentId, awbCode, courierName)
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
- `apps/_template`, `apps/beautifulmess`, and `apps/beautifulsilver` instead
  pre-create the order at `PENDING` when checkout starts, so their own
  webhook routes compose `verifyRazorpaySignature` with an
  `updateMany({ where: { status: "PENDING" } })` instead -- idempotent
  because a redelivery finds no matching row to update. See
  `app/api/webhooks/razorpay/route.ts` in any of the three apps.

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

`Customer.expoPushToken` (nullable) was added for the mobile app's push
notifications (diagram 11) -- one token per customer, set by a mobile app
via `POST /api/mobile/push-token` after login. Not a separate table: this
reference app models one active device per customer, not a device list.

`Order` gained `shipTo*` fields (name, email, phone, addressLine1(+2),
city, state, pincode) and `shipmentId`/`awbCode`/`courierName` -- all
nullable -- when the Shiprocket integration was completed (diagram 3):
Shiprocket's `createShipment` API needs a finished destination address
per order and doesn't collect one itself, so each storefront's checkout
now collects it (`packages/ui`'s `AddressForm`, backed by Google Places
Autocomplete) and stores it directly on `Order` rather than a separate
`Address` model, since nothing reuses a saved address across orders yet.
See `packages/shipping/README.md`.

## 5. `packages/ui` theming flow

```mermaid
graph LR
  Theme["StorefrontTheme object\n(colors, fonts, radius, logo)"] --> Provider[ThemeProvider]
  Provider -->|sets CSS variables| Wrapper["Wrapping &lt;div&gt; style"]
  Wrapper --> Tailwind["Tailwind tokens\nbg-brand, font-heading, ..."]
  Tailwind --> Components["Button, ProductGrid, CartSummary,\nCheckoutSteps, VariantPicker, AddressForm"]
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
  Fulfilled --> Hook{"onStatusApplied?\n(optional)"}
  Cancelled --> Hook
  Hook -->|apps/beautifulmess| Push["sendOrderStatusPushNotification()\n(diagram 11)"]
```

`applyCourierStatus`/`POST` take an optional `onStatusApplied` callback,
fired only when a status actually changed -- `packages/shipping` itself
knows nothing about push notifications; `apps/beautifulmess`'s own
`app/api/webhooks/shiprocket/route.ts` supplies the callback. Any other
storefront app can ignore the parameter with no behavior change.

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

## 10. Mobile app architecture

```mermaid
graph LR
  MobileCustomer((Mobile customer))

  subgraph MobileApp["apps/mobile-template (Expo / React Native)"]
    Screens["App.tsx screens\ncatalog / cart / checkout / order"]
    CartCtx["CartProvider\n(AsyncStorage)"]
    TokenStore["SecureStore\n(session token)"]
  end

  subgraph MobileShared["packages/*"]
    UINative["ui-native\n(ThemeProvider, Button,\nProductCard, ProductGrid)"]
    ApiClient["api-client\n(createStorefrontApiClient)"]
  end

  subgraph BFF["apps/beautifulmess -- app/api/mobile/**"]
    MobileRoutes["Route Handlers:\nproducts, collections,\nauth, wishlist, orders,\npush-token"]
  end

  DB[("Postgres")]
  Expo[["Expo Push Service"]]

  MobileCustomer --> Screens
  Screens --> UINative
  Screens --> CartCtx
  Screens --> ApiClient
  ApiClient --> TokenStore
  ApiClient -->|HTTPS, Bearer token| MobileRoutes
  MobileRoutes --> DB
  MobileRoutes -.push token.-> Expo
```

`app/api/mobile/**` reuses the exact same pure business logic the web
Server Components/Actions call (`lib/catalog.ts`, `lib/checkout.ts`,
`lib/wishlist.ts`, ...) -- each mobile route is a thin JSON wrapper, never
a second implementation. Auth travels as a `Authorization: Bearer` header
instead of a cookie, verified by the same `verifySessionToken()` the web
cookie path uses (`lib/auth.ts`'s `getCustomerIdFromAuthHeader`).

## 11. Mobile checkout + push notification flow

```mermaid
sequenceDiagram
  participant C as Mobile customer
  participant App as apps/mobile-template
  participant API as apps/beautifulmess\n(app/api/mobile/**)
  participant DB as Postgres
  participant RP as Razorpay
  participant SR as Shiprocket
  participant Expo as Expo Push Service

  C->>App: Browse -> add to cart (AsyncStorage)
  C->>App: Checkout
  App->>API: POST /api/mobile/orders {lines, discountCode}
  API->>RP: create order (skipped for a synthetic id under E2E_MOCK_EXTERNAL_APIS)
  API->>DB: Order.create(status=PENDING)
  API-->>App: {gatewayOrderId, amount, isMocked}

  alt isMocked (dev/test default)
    App->>App: skip straight to order screen
  else real test-mode credentials
    App->>App: WebBrowser.openBrowserAsync(mobile-pay page)
    App->>API: GET /checkout/mobile-pay/:gatewayOrderId
    API-->>App: page auto-opens Razorpay Checkout.js
    C->>RP: completes test-mode payment
    App->>App: shopper returns to the app
  end

  RP->>API: webhook: payment.captured
  API->>DB: Order.update(status=PAID) -- idempotent

  App->>API: poll GET /api/mobile/orders/:gatewayOrderId (every 3s)
  API-->>App: {status}

  SR->>API: webhook: courier status update
  API->>DB: Order.update(status=FULFILLED/CANCELLED)
  API->>Expo: POST push (customer's stored expoPushToken)
  Expo-->>C: push notification delivered
```

The Razorpay/Shiprocket webhooks are the same handlers the web purchase
flow (diagram 3) uses, completely unaware mobile exists -- mobile just
polls the same `Order` row the web `/orders/:gatewayOrderId` page reads.
Push delivery only happens if the customer is logged in and granted
notification permission (`POST /api/mobile/push-token`); it's silently
skipped otherwise (diagram 7).

## 12. Per-client mobile config (`packages/mobile-config`)

```mermaid
graph LR
  Config["StorefrontMobileConfig\n(appName, slug, bundleIdentifier,\nandroidPackage, easProjectId, theme)"] --> Build["buildExpoConfig()"]
  Build --> ExpoConfig["Expo config object\n(name, ios.bundleIdentifier,\nandroid.package, extra.eas.projectId)"]
  ExpoConfig -.iOS/Android build target.-> EAS[["EAS Build"]]
```

The mobile analogue of each web app's `app/layout.tsx` theme object --
`apps/beautifulmess-mobile/app.config.ts` supplies Beautiful Mess's real
bundle ID, Android package, and theme colors (matching
`apps/beautifulmess`'s own layout). `buildExpoConfig()` implements this
merge and has its own unit tests, but Expo's config loader executes
`app.config.ts` directly under Node's CommonJS `require()` (outside
Metro), and `packages/mobile-config` ships ESM source with no build
step -- a runtime `import` of it from `app.config.ts` fails, so today
`app.config.ts` only takes a *type-only* import from the package and
inlines the equivalent object literal itself. `buildExpoConfig()` stays
the source of truth for what that merge should produce; switching
`app.config.ts` back to calling it directly is a one-line change once the
package gains a real CJS build output.
