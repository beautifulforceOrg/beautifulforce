# Database schema (Neon Postgres)

The full entity-relationship diagram for `packages/db/prisma/schema.prisma`
-- every table and column that actually exists in each storefront's real
Neon database (every storefront copies this schema into its own isolated
instance; see `packages/db/README.md` and the Isolation section of
`CLAUDE.md`). This is the single source of truth for schema shape --
`docs/architecture.md`'s diagram 4 keeps a short relations-only summary
plus the commentary on *why* each addition happened, and links here for
the full picture.

**Keep this file current**: regenerate the diagram below whenever
`packages/db/prisma/schema.prisma` changes (new model, new field, new
relation, new enum). See CLAUDE.md's "Architecture diagrams" section.

```mermaid
erDiagram
  Product {
    string id PK
    string slug UK
    string name
    string description "nullable, raw HTML"
    int price "paise"
    string sku UK "nullable"
    string barcode "nullable"
    string brand "nullable"
    int weightGrams "nullable"
    float lengthCm "nullable"
    float widthCm "nullable"
    float heightCm "nullable"
    int packageWeightGrams "nullable"
    float packageLengthCm "nullable"
    float packageWidthCm "nullable"
    float packageHeightCm "nullable"
    int mrp "nullable, paise"
    string hsnCode "nullable"
    int gstRatePercent "nullable"
    string countryOfOrigin "nullable, default India"
    string manufacturerDetails "nullable"
    string material "nullable"
    string careInstructions "nullable"
    string tags "nullable, comma-separated"
    boolean isPublished "default true"
    int lowStockThreshold "nullable"
    datetime createdAt
    datetime updatedAt
  }
  ProductVariant {
    string id PK
    string productId FK
    string name
    string value
    string sku UK "nullable"
    int price "nullable, overrides Product.price"
    int stockQty "nullable = untracked, 0 = sold out"
  }
  ProductImage {
    string id PK
    string productId FK
    string url
    int position "default 0"
    string altText "nullable"
  }
  Collection {
    string id PK
    string slug UK
    string name
  }
  Customer {
    string id PK
    string email UK
    string name "nullable"
    string passwordHash "nullable = guest/webhook-created"
    string expoPushToken "nullable"
    datetime createdAt
  }
  WishlistItem {
    string id PK
    string customerId FK
    string productId FK
    datetime createdAt
  }
  Review {
    string id PK
    string productId FK
    string customerId FK
    int rating "1-5"
    string comment
    datetime createdAt
  }
  NewsletterSubscriber {
    string id PK
    string email UK
    datetime createdAt
  }
  ContactMessage {
    string id PK
    string name
    string email
    string phone "nullable"
    string comment
    datetime handledAt "nullable = unhandled"
    datetime createdAt
  }
  Order {
    string id PK
    string customerId FK "nullable, guest checkout"
    string gatewayOrderId UK "nullable, Razorpay order id"
    string status "PENDING, PAID, FULFILLED, or CANCELLED"
    string shipToName "nullable"
    string shipToEmail "nullable"
    string shipToPhone "nullable"
    string shipToAddressLine1 "nullable"
    string shipToAddressLine2 "nullable"
    string shipToCity "nullable"
    string shipToState "nullable"
    string shipToPincode "nullable"
    string shipmentId "nullable"
    string awbCode "nullable"
    string courierName "nullable"
    int amountPaid "nullable, paise"
    int discountAmount "nullable, paise"
    datetime createdAt
    datetime updatedAt
  }
  OrderItem {
    string id PK
    string orderId FK
    string productId FK
    string variantId FK "nullable"
    int quantity
  }
  AdminUser {
    string id PK
    string email UK
    string passwordHash
    int failedAttempts "default 0"
    datetime lockedUntil "nullable"
    datetime createdAt
  }
  DiscountCode {
    string id PK
    string code UK "uppercase-normalized"
    int percentOff "1-100"
    boolean active "default true, soft-deactivate"
    datetime createdAt
    datetime updatedAt
  }
  Ticket {
    string id PK
    string subject
    string description
    string category "BUG, FEATURE, CHANGE, or OTHER"
    string status "OPEN, IN_PROGRESS, RESOLVED, or CLOSED"
    string createdById FK
    datetime createdAt
    datetime updatedAt
  }
  TicketComment {
    string id PK
    string ticketId FK
    string authorId FK
    string body
    datetime createdAt
  }

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
  AdminUser ||--o{ Ticket : files
  AdminUser ||--o{ TicketComment : writes
  Ticket ||--o{ TicketComment : has
```

## Notes

- **`Customer` and `AdminUser` are deliberately unconnected** -- no
  foreign key between them. `AdminUser` must never be reachable through a
  shopper-facing query. `apps/beautifulmess`'s "Admin" site-header tab
  bridges the two at the *session* layer only (matching email + an
  allowlist check at request time, not a database relation) -- see
  `lib/admin/auth.ts#establishAdminSessionForCustomer` and diagram 4's
  commentary in `docs/architecture.md`.
- **`NewsletterSubscriber` and `ContactMessage` are standalone** -- both
  forms are anonymous, no account required.
- Every storefront's Neon database has its own copy of this exact schema
  (isolation model, see `CLAUDE.md`) -- this diagram is the shape shared
  by all of them, not a single shared database.
