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

**Deliberately not fabricated** -- flagged in the onboarding plan as needing
real input from the client before launch, not invented here:

- Privacy Policy, Terms of Service, and Shipping Policy: no real copy was in
  the export, so these render a clear "pending" placeholder
  (`app/policies/policy-pending.tsx`) rather than invented legal text.
  Refund Policy *is* real -- it came from the site's own FAQ.
- Instagram gallery and press-mention logos (GQ/Elle/Rolling Stone) from the
  live homepage: omitted rather than faked, since reproducing them needs a
  real Instagram embed and verified logo usage rights respectively.
- Customer accounts and historical order data: **not migrated**, per
  explicit instruction -- this is a fresh storefront, not a data migration
  of the existing customer base.

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
