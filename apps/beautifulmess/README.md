# apps/beautifulmess

Storeforge's first real client: Beautiful Mess (https://beautifulmess.in/),
migrating off Shopify. See `../../beautifulmess-onboarding-plan.md` for the
full migration plan this app implements the early phases of.

## What's real vs. what's a placeholder

**Real, migrated data** (`data/shopify-export/`, provided by the client as
Shopify CSV/theme exports -- not scraped):

- All 31 products, their real names, descriptions, prices, size/denomination
  variants, and real Shopify CDN product images (`scripts/import-shopify-catalog.ts`)
- The real brand theme: colors and fonts (Poppins body / Cormorant heading)
  from `data/shopify-export/settings_data.json`'s `color_schemes.scheme-1`
  and font settings (`app/layout.tsx`) -- with `colorForeground`,
  `colorMuted`, and `colorBrand` darkened just enough to pass WCAG AA
  contrast; the real values failed axe-core's a11y check (see the comment
  in `app/layout.tsx` for the exact numbers)
- Real site copy for the founder story, "Our Ethos", all four customer
  testimonials, the FAQ, and footer contact/hours -- pulled from the live
  site's actual text, not invented
- Real nav structure (Home / Shop / Help / About Us) and every link in it
  resolves to a real page (verified by `e2e/purchase.spec.ts`'s link-check
  test)
- Privacy Policy, Terms of Service, Shipping Policy, and Refund Policy: all
  four pulled from the live site's actual published policy pages (not in
  the CSV/theme export, fetched separately) -- not summarized or invented
- The real page structure and section order -- announcement bar, centered
  logo header (the client's real logo file) with search/chat/WhatsApp/
  wishlist/account/cart icons, a full-bleed hero and 4-image strip using
  the exact images the live site currently serves, "Most Loved Products",
  a "Most Searched" category band, a founder section with the real founder
  photo, "Our Ethos", testimonials, an FAQ accordion, the flagship store
  band (with a real Google Maps embed of the real address on the Contact
  page), a "Terms and Policies" footer popover (same five links as the
  real one), and the trust-badges row -- reproduced from a live audit of
  the site itself (Playwright screenshots + computed-style + real asset
  URL extraction; see "How the layout was matched" below), not the
  original CSV/theme-settings export alone. All copy in these sections is
  real, sourced the same way as everything above.
- Facebook (`facebook.com/beautifulmessbyann`) and Instagram
  (`instagram.com/beautifulmessbyann`) links, read directly off the live
  site's own footer markup -- not guessed.
- Accounts, order history, and a real wishlist: email/password signup and
  login (`lib/auth.ts`, `lib/session-token.ts`), an `/account` page showing
  a customer's real order history and saved wishlist, and a wishlist that
  persists server-side per customer (`WishlistItem` in `packages/db`) --
  see "Accounts" below for what this is and isn't.

**Deliberately not fabricated or reproduced**:

- Instagram gallery and press-mention logos (GQ/Elle/Rolling Stone) from the
  live homepage: omitted rather than faked, since reproducing them needs a
  real Instagram embed and verified logo usage rights respectively.
- Historical customer accounts and order data from Shopify: **not
  migrated**, per explicit instruction -- everyone who signs up here is a
  new account on this platform, not an imported one.
- Byte-for-byte CSS/animation parity with Shopify's "Horizon" theme (the
  specific carousel/slideshow JS, exact drawer-cart motion, exact px-level
  spacing): not attempted, and not the same thing as the structural/visual
  parity above. What's real is the brand, the layout structure, and the
  full catalog with working commerce, built as this platform's own
  original component code (`packages/ui` + this app) -- never Shopify's
  theme source, which is the theme vendor's IP, not the client's, and
  wasn't copied at any point.

## How the layout was matched

CSV and theme-settings exports only carry data tokens (colors, fonts,
product fields) -- not page layout. To get real layout/spacing/structure
without copying Shopify's theme source, a throwaway Playwright script
(`chromium.launch()` + `page.goto()` against the live site, not part of
this app or its test suite) took full-page screenshots of the home,
collection, product, cart, about, and contact pages and read real computed
styles (`getComputedStyle`) for key elements. That gave real measurements
(header height, hero aspect ratio, grid columns, button transition timing,
the exact "shipped to 6+ countries" / "20000+ happy moms" copy) to
reimplement in this app's own Tailwind/React code -- reading rendered
output and writing new code, not copying template files.

## Local development

```bash
pnpm --filter @storeforge/db run db:up   # start local Postgres, once (shared with other apps)
pnpm run db:push                          # sync the schema into the isolated `beautifulmess` database
pnpm run import:catalog                   # import the real catalog from data/shopify-export/
pnpm run dev                              # http://localhost:3200
```

This app's database (`beautifulmess`, on the same local Postgres container
as everything else) is separate from `packages/db`'s own `storeforge_test`
and `apps/_template`'s -- matching the platform's one-database-per-storefront
principle even in local dev.

## Schema extension

The real catalog needed variants (sizes), multi-image galleries, and
collections -- none of which the original `packages/db` schema had. Added
`ProductVariant`, `ProductImage`, and `Collection` there rather than here,
since any future apparel client needs the same shapes (see
`packages/db/README.md`). `packages/ui`'s `VariantPicker` component and
`CartLine.variantLabel` field were added for the same reason.

## Accounts

Real login, not "Login with Shop" -- that button authenticates against
Shopify's own identity system and only works when checkout runs on
Shopify's infrastructure. Since this app's checkout is Razorpay on an
independent Next.js/Postgres stack, there's no Shopify checkout session
for it to attach to. What's built instead is this platform's own account
system: email/password signup (`lib/account-actions.ts`), a signed
session cookie (HMAC-SHA256 over Node's built-in `crypto`, no new
dependency), and an `/account` page with real order history and wishlist.

This is a genuine, working, **local** stand-in -- not the production
choice. `storeforge-implementation-plan.md` calls for Supabase Auth or
Clerk in production; hand-rolled password storage and session handling is
a real security surface that a dedicated auth provider is better
positioned to own long-term. Password reset would additionally need real
email sending (Resend, per the same stack plan) -- deferred like the other
real-service integrations (Neon, Vercel, Razorpay, Shiprocket) until this
storefront is ready to go live.

## Testing

- `e2e/purchase.spec.ts` -- the full real flow: browse the real catalog,
  pick a real size variant, check out, Razorpay's `payment.captured` and
  Shiprocket's `DELIVERED` webhooks, plus a check that every header/footer
  link actually resolves (not a dead link).
- `e2e/account.spec.ts` -- sign up, save a wishlist item, log out, confirm
  `/account` requires logging back in, log back in and confirm the same
  wishlist item is still there; a signed-out visitor trying to wishlist
  something is sent to log in instead.
- `e2e/navigation.spec.ts` -- every header nav path (direct links, the
  Shop/Help dropdowns, the mobile menu) actually navigates and the
  dropdown/menu closes afterward (a real bug caught during review: it
  didn't, since Next.js client-side navigation doesn't remount the header);
  the footer's Terms and Policies popover and its five links; the real
  Facebook/Instagram hrefs; wishlisting from the catalog grid; and cart
  quantity +/-/remove end to end.
- `e2e/a11y.spec.ts` -- axe-core on the home page and a product detail page.
- `lib/auth.test.ts`, `lib/session-token.test.ts` -- unit tests for
  password hashing/verification and signed-session-token creation/
  verification (correct/wrong password, tampered or expired tokens,
  malformed input), run with `pnpm run test`.
