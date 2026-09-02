# Technical Debt, Future Enhancements & Known Limitations

Developer-facing (unlike `docs/pending-actions.md`, which is the
plain-language list of things needing the store owner's action). This
file tracks the engineering side: things worth fixing, building, or at
least knowing about. Update it the same way as `pending-actions.md` —
add an item when it's identified, remove it once it's actually resolved.

---

## Technical debt

- **Catalog data quality** (from the Shopify import, not the code):
  - 8 "Sling Bags" product listings are really only 3 designs in
    different colors — should be 3 products with color variants
    (`ProductVariant` already supports this).
  - No package weight/dimensions ever imported — every product falls
    back to `lib/shipping.ts`'s generic constants regardless of what
    it actually is, undermining the real-weight Shiprocket integration.
  - All 22 frocks share one price (₹5,500), all 8 bags share another
    (₹1,500) — never confirmed whether these are real or import
    placeholders.
- **Product descriptions render via `dangerouslySetInnerHTML`**
  (`product-detail.tsx`) — safe today since the source is trusted
  first-party CSV content, reviewed for `<script>` tags before this was
  wired up. Would need real sanitization if the import pipeline ever
  accepts less-trusted (e.g. merchant-entered) HTML.
- **Search is a plain case-insensitive substring match** on product name
  only (`lib/catalog.ts#searchProducts`) — no fuzzy matching, no matching
  on description/tags/SKU.
- **`packages/db/prisma/schema.prisma` is a template each storefront
  manually copies** (per this repo's isolation model) — there's no
  tooling to detect or propagate schema drift between `apps/beautifulmess`
  and future storefronts once they diverge.

## Future enhancements (deliberately not built yet)

- **Sentry-driven automated triage** — once Sentry is actually
  configured (see `docs/pending-actions.md`), a real option worth
  revisiting: a Sentry Alert Rule webhook could trigger a cloud Claude
  Code routine (via this session's `RemoteTrigger` tool) that fetches
  the issue's stack trace/context, investigates the relevant code, and
  reports a diagnosis or opens a draft PR -- deliberately investigate-
  and-propose rather than auto-fix-and-deploy, since a wrong automated
  fix pushed straight to production is worse than the original error.
  Not built yet: the cost model for cloud-routine execution (vs. a local
  session) wasn't confirmed before this was deferred -- verify that with
  Anthropic before committing to the approach.
- **Abandoned-cart reminders** — blocked on choosing a real email/SMS/
  WhatsApp provider (see `docs/pending-actions.md`) and on the cart
  becoming server-persisted (see Known Limitations below).
- **Extend admin-managed content beyond Testimonials/FAQ** — the
  homepage's Ethos pillars, hero image, Instagram teaser images, and
  press logos are still hardcoded in `app/page.tsx`; the same
  `/admin/content` pattern could extend to them.
- **A real size chart** — the PDP's "Size Chart" accordion just tells
  customers to confirm on WhatsApp rather than showing actual
  measurements per product/category.
- **Customer-facing order cancellation/return-request flow** — currently
  no self-service option beyond viewing order status (consistent with
  the storefront's stated no-returns policy, but worth a deliberate
  product decision either way).
- **Multi-address book** — `Customer` currently stores exactly one saved
  address (the last one used at checkout), not multiple named addresses.
- **Real full-text/fuzzy product search** if the catalog grows past what
  substring matching handles well (e.g. Postgres full-text search or a
  hosted search service).
- **Phone+OTP customer login** — a full plan exists (see the session
  history / plan file `sorted-swimming-quail.md` if still present) but
  was never implemented; the web app still uses email+password, and the
  mobile app has its own separate email+password flow.
- **Actually sending WhatsApp marketing campaigns** — `/admin/customers`
  only exports a CSV today; sending campaigns still needs a WhatsApp
  Business API integration and a real opt-in/consent flow.

## Known limitations

- **Shipping is currently free in practice** — `lib/checkout.ts` never
  adds a shipping line to the charged amount (`amount = subtotal -
  discount`, nothing else), and the shipping policy/terms/PDP copy now
  says so explicitly (previously they quoted stale, inconsistent
  fabricated costs across three separate pages instead). "Have
  Shiprocket calculate shipping dynamically" is not implemented -- if
  that's wanted, it needs real design (add a shipping line at checkout
  sourced from a live Shiprocket rate-check call) before the copy could
  honestly say costs are calculated automatically.
- **Cash on delivery was documented but never built.** The old shipping
  policy page claimed a COD option existed (with a ₹120 charge and 20%
  advance) -- verified absent from the actual checkout flow entirely
  (only Razorpay online payment exists, see `lib/checkout.ts`/
  `app/checkout/page.tsx`). The claim has been removed rather than kept
  as a stale promise.

- **The cart is client-side/localStorage only** — never persisted
  server-side per customer. This means no true cross-device cart
  continuity, and it's the main blocker for abandoned-cart detection
  (there's no server record of an in-progress cart to notice as
  "abandoned").
- **No password-reset ("forgot password") flow for customers.** Verified
  absent — `lib/account-actions.ts` only supports changing a password
  from within an already-authenticated session
  (`lib/account-settings.ts`). A customer who forgets their password has
  no self-service recovery today. (Blocked in part by there being no
  real email-sending infrastructure at all — see next item.)
- **No real email-sending infrastructure anywhere in the app.**
  `lib/email.ts` is a validator only, not a sender — no order
  confirmation emails, no password-reset emails, nothing. Needed before
  password reset or abandoned-cart reminders can exist.
- **No scheduled/cron job infrastructure** in this monorepo at all
  (confirmed: no `vercel.json` crons config, no job-scheduling package)
  — needed for abandoned-cart detection or any other time-based
  background task.
- **Admin accounts are seeded via a CLI script only**
  (`scripts/seed-admin-users.ts`) — no self-service admin invite/
  creation UI; adding a new admin requires running a script with direct
  database access.
- **The admin customer directory's phone number comes from
  `Customer.addressPhone`**, which is only populated after a customer's
  first checkout — a signed-up customer who has never ordered has no
  phone number on file, so they're silently skipped for WhatsApp export
  purposes.
- **No error/uptime monitoring** (e.g. Sentry) wired in anywhere —
  production errors are only visible via Vercel's own function logs.
- **No rate-limiting anywhere in the app** except the admin-login
  failed-attempt lockout — signup, OTP-less login, discount-code
  application, etc. have no throttling.
