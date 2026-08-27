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
  logo header with search/chat/WhatsApp/wishlist/cart icons, full-bleed
  hero, "Most Loved Products", a "Most Searched" category band, founder
  story, "Our Ethos", testimonials, an FAQ accordion, the flagship store
  band (with a real Google Maps embed of the real address on the Contact
  page), and the trust-badges row -- reproduced from a live audit of the
  site itself (Playwright screenshots + computed-style extraction; see
  "How the layout was matched" below), not the original CSV/theme-settings
  export alone. All copy in these sections is real, sourced the same way
  as everything above.

**Deliberately not fabricated or reproduced**:

- Instagram gallery and press-mention logos (GQ/Elle/Rolling Stone) from the
  live homepage: omitted rather than faked, since reproducing them needs a
  real Instagram embed and verified logo usage rights respectively. A
  "Follow us on Instagram" link uses the real handle (`@beautifulmessbyann`,
  read off the gift-card product artwork itself, not guessed).
- Customer accounts and historical order data: **not migrated**, per
  explicit instruction -- this is a fresh storefront, not a data migration
  of the existing customer base. The real site's "Have an account? Log in"
  prompt is likewise not reproduced, since this build has no account system.
- Wishlist: the heart icon is real (matches the live site's placement and
  behavior visually) but only toggles local component state -- there's no
  wishlist backend, matching this build's scope.
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

## Testing

- `e2e/purchase.spec.ts` -- the full real flow: browse the real catalog,
  pick a real size variant, check out, Razorpay's `payment.captured` and
  Shiprocket's `DELIVERED` webhooks, plus a check that every header/footer
  link actually resolves (not a dead link).
- `e2e/a11y.spec.ts` -- axe-core on the home page and a product detail page.
