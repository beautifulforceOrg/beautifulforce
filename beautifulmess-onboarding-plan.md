# Beautiful Mess — Onboarding & Migration Plan

**Client:** Beautiful Mess (https://beautifulmess.in/) — currently on Shopify
**Target:** `apps/beautifulmess` inside the Storeforge monorepo
**Status:** Planning only. No code, no scaffolding, no scraping has been performed. This document is the plan to execute once reviewed.
**Author context:** Written against `storeforge-design-plan.md`, `storeforge-implementation-plan.md`, `packages/ui/README.md`, `packages/db/README.md`, and the current `packages/db/prisma/schema.prisma` / `apps/_template` as they exist in this repo today.

---

## 0. What this client actually plugs into

Per the design plan's onboarding steps (Design Plan, "Multi-Client Operating Model"), onboarding Beautiful Mess means:

1. Scaffold `apps/beautifulmess` from `apps/_template` (the proven reference storefront — `@storeforge/ui`, `@storeforge/db`, `@storeforge/payments`, `@storeforge/shipping` already wired end-to-end there).
2. Provision a **new Neon database**, a **new domain binding** (`beautifulmess.in` or a subdomain during parallel-run), and **new Razorpay/Shiprocket credentials** scoped to this client only.
3. Everything Beautiful-Mess-specific — their catalog data, their brand theme, any one-off business rule (e.g. a size chart, a specific return-window policy) — lives inside `apps/beautifulmess` only, never in `packages/`.
4. Only genuinely reusable output of this migration (e.g. "a variant/collection schema shape that any future apparel/D2C client will also need") is a candidate to graduate into `packages/db`'s template — and only after this storefront is stable (Implementation Plan, Stage 3: "extract reusable patterns" happens *after* stability, not during first build).

This is the first real client on the platform, so this migration also doubles as the "Stage 1" build described in the Implementation Plan's rollout — the first versions of `packages/payments` and `packages/shipping` usage patterns for a real catalog get exercised here.

---

## 1. Content & asset extraction from the live Shopify site

**Governing principle: ask before we scrape.** We do not have Shopify Admin API or CSV export access today. The *correct* real-world approach is to request it, not to scrape — scraping is the fallback when the client can't or won't get us access in time.

### 1a. Preferred path — ask the client for real exports
This should be the first action in Phase 1 (Discovery), not a parallel option:
- **Product/variant/collection CSV export** from Shopify Admin (`Products → Export`). This gives us structured data (handle, title, description HTML, vendor, product type, tags, price, compare-at-price, variant options, SKU, inventory, image URLs, collection membership) — vastly more reliable than parsing rendered HTML.
- **Theme code access is NOT requested for reuse** — see Section 2. We only need read access to confirm content structure, not to copy the theme.
- **Customer/order history export** (Shopify Admin → Customers/Orders CSV, or a request to their Shopify Partner/support for a full data export) — needed only if we decide historical data migrates (see Section 5).
- Ask for the **Shopify Admin API access** (a private/custom app with `read_products`, `read_customers`, `read_orders`, `read_content` scopes) if the engagement will be ongoing enough to justify it, or if the CSV export proves incomplete (e.g. metafields, custom page content aren't in the standard product CSV).
- Ask about **font licenses** directly (see Section 1e) and **any third-party apps in use** (see Section 1f) — this is a client conversation, not something inferable from the storefront.

This request should go out in writing (email) at the start of Phase 1, with a deadline, since it gates the rest of the timeline.

### 1b. Fallback path — public storefront only (no admin/API access granted in time)
If the client cannot produce exports on the needed timeline, fall back to a scripted crawl of the **public storefront only**:
- Use Shopify's own public JSON endpoints where the theme exposes them — most Shopify storefronts serve `/products.json`, `/collections.json`, and `/products/<handle>.json` unauthenticated. This is structured data straight from the platform, not HTML scraping, and is the best fallback short of admin access.
- Where JSON endpoints aren't exposed by the theme, use a scripted crawl (e.g. Playwright, since it's already the platform's chosen e2e tool — no new tooling to introduce) to walk the sitemap (`/sitemap.xml`) and capture rendered HTML for: homepage, each collection page, each PDP, and static pages (About, FAQ, Shipping/Returns, Contact, Privacy/Terms).
- A plain `wget --mirror` / `httrack`-style full mirror is explicitly **not** the goal — we do not want the Shopify theme's HTML/CSS/JS files themselves (see Section 2). The crawl target is *content extraction* (product data, copy, image URLs, nav structure), not a byte copy of the site.
- Treat this fallback as materially worse than exports: no reliable access to inventory counts, tags/metafields, un-linked draft products, or historical order data. Flag to the client that some data (metafields, hidden/unlisted products, full order history) may simply be unrecoverable this way.

### 1c. Product catalog
Regardless of path, capture per product: title, handle/slug, full description (HTML, since it likely contains formatting/embedded content), price, compare-at-price, all variant option names/values (e.g. Size, Color) and their individual SKUs/prices/stock, all images per product (with their variant associations), product type/tags, and collection membership. This inventory becomes the input to the catalog import tooling in Phase 5 — see Section 3 for how it maps onto (an extended) `packages/db`/`apps/beautifulmess` schema.

### 1d. Images
- Pull original-resolution image URLs (Shopify CDN URLs support size-parameter stripping to get the largest cached version — e.g. removing the `_WIDTHx.` suffix — this is a legitimate use of the client's own hosted asset, not scraping a third party).
- Land them in a client-specific ImageKit folder/namespace (per the implementation plan's stack — ImageKit is already the chosen per-storefront image/CDN layer). Each storefront gets its **own ImageKit account** per the stack table, so this is `apps/beautifulmess`-local configuration (an ImageKit URL-endpoint env var + upload script), not a `packages/` change — image *handling logic* (Next.js `<Image>` wiring, transform helpers) is the kind of thing that could graduate to `packages/ui` later if a second client also needs it, but the migration/upload tooling itself is one-off and stays local to `apps/beautifulmess/scripts/`.
- Re-optimize on upload (WebP/AVIF, defined breakpoints) rather than re-hosting Shopify's already-transformed CDN variants — starting from the largest original avoids compounding lossy re-compression.
- Any imagery that is clearly **third-party stock photography** (not product photos, not the client's own lifestyle shoot) needs a licensing check before migrating — see Section 2.

### 1e. Fonts
- Identify the theme's fonts (visible in the rendered page's `@font-face`/CSS, or theme settings if we get admin access).
- **If Google Fonts** (a large share of Shopify themes default to these): free to reuse directly, load via the same mechanism `packages/ui`'s `ThemeProvider` expects (`fontSans` as a CSS value — see Section 4), no licensing action needed.
- **If a paid/custom/licensed font** (Shopify theme marketplace fonts, a font bundled with a purchased theme, or a bespoke commissioned typeface): the license needs to be checked before reuse. A font licensed "for use with Theme X on shopify.myshopify.com domain Y" does **not** automatically carry over to a new, non-Shopify platform — this is a real licensing question, not a technicality. Action: ask the client (a) which font it is, (b) whether they have a receipt/license for it, (c) what the license's usage terms say. If unclear or restrictive, substitute a visually similar Google Font or license a fresh web-font license for the new domain. Do not silently reuse the font file.

### 1f. Page structure & navigation
Capture and document (as a content inventory, not code) for each of: homepage sections (hero, featured collections, testimonials, etc.), the PDP layout (image gallery, variant selector, description, reviews block if present, upsell/cross-sell block if present), collection/PLP layout (filters, sort, grid), and every static page (About, FAQ, Shipping & Returns, Contact, Privacy, Terms, Size Guide). Also capture the full navigation tree (header menu, footer menu, any mega-menu structure) and any redirects/legacy URLs currently in use.

### 1g. Shopify-specific functionality with no current Storeforge equivalent — flag, don't drop
The current `packages/ui` / `apps/_template` stack covers: product grid, product card, cart, checkout steps, and a Razorpay/Shiprocket order lifecycle. It does **not** yet have equivalents for common Shopify app-driven features. Each of these needs an explicit client decision before build, not a silent omission:

| Shopify feature (if present on beautifulmess.in) | Storeforge equivalent today | Decision needed |
|---|---|---|
| Product reviews widget (e.g. Judge.me, Loox, etc.) | None | Drop for launch, replace with a simple future `packages/ui` reviews component, or embed a third-party widget as a stopgap? |
| Post-purchase / cart upsells | None | Defer to a later phase, or scope a minimal version into `apps/beautifulmess` as a one-off? |
| Subscriptions (recurring orders) | None (`Order`/`OrderItem` model has no recurrence concept) | Out of scope for launch unless the client currently has active subscribers — if so, this is a hard blocker item, see Section 5 |
| Loyalty/rewards app | None | Client decision — likely out of scope for v1, flag for a future `apps/beautifulmess`-local feature |
| Live chat widget | None (unrelated to storefront platform choice — can be added independently via a script tag) | Not actually a migration blocker; re-add via the same third-party embed regardless of platform |
| Gift cards | None (`packages/payments`/schema has no gift-card model) | Client decision — if active gift cards exist, they must remain honorable somewhere (see Section 5) |
| Back-in-stock notifications | None | Defer |
| Bundle/kit products | Schema has no bundle concept (see Section 3) | Client decision on whether any live bundle products need day-1 support |

**Action:** produce a checklist of which of these are actually in use on beautifulmess.in during Phase 1 discovery, and get an explicit yes/no/defer decision from the client on each before Phase 2 schema work starts — this avoids discovering a launch blocker mid-build.

---

## 2. Legal/ethical considerations of migrating a live commercial site's content

This section distinguishes what is straightforwardly fine from what needs an explicit check, per the client-content-ownership logic in the Design Plan's IP section (background IP vs. foreground IP) extended to a migration context.

**Fine to migrate directly — it's the client's own content moving to their own new store:**
- Product photography the client shot or commissioned (their own product, their own studio/photographer work-for-hire).
- Product names, descriptions, and marketing copy the client wrote.
- Their logo, brand colors, and brand assets.
- Their own customer list / order history data, subject to normal data-protection handling (see Section 5) — it's their data, migrating between systems they control.
- Structural facts about the site (what pages exist, what the nav looks like, what a PDP contains) — these are ideas/facts, not copyrightable expression, and are fine to *document* as a content inventory even under the fallback scraping path.

**Needs a licensing check before reuse:**
- **Fonts** — see Section 1e. The specific license terms (not just "did we see it on their old site") govern whether it can move to a new domain/platform.
- **Third-party stock imagery** — any image the client licensed from a stock library (rather than shot themselves) typically has a license tied to specific usage terms (sometimes tied to a domain, a duration, or a platform). Ask the client to confirm provenance for any imagery that looks like stock photography (lifestyle shots not obviously the client's own shoot) before migrating it as-is.
- **Any third-party app content** — e.g. review text collected via a reviews app may be subject to that app vendor's terms about data portability; check before assuming it exports freely.

**Should NOT be copied — not the client's IP to give us:**
- **The Shopify theme itself** — its HTML/CSS/JS/Liquid template code, whether a free Shopify theme or a purchased one (Theme Store or third-party). This is the theme vendor's IP, licensed to the client for use *on Shopify*, not a transferable asset the client can hand to a new platform. This is why Section 1's fallback crawl explicitly targets *content*, not a site mirror — no `wget --mirror`/theme-file copying, ever, regardless of access level.
- **Shopify's own platform code, checkout flow, or proprietary interaction patterns** — visual "inspiration" from layout structure is fine (structure/ideas aren't copyrightable), but no lifting of theme markup, CSS, or JS.
- Any third-party app's proprietary code/widget implementation (only the client's *data* inside that app, if portable, is theirs).

**Process implication:** the Phase 1 discovery step (Section 1) should explicitly separate "content we're extracting" (copy, prices, product data, the client's own images) from "structure we're observing for reference" (page layout, nav shape) — the former gets migrated, the latter gets *rebuilt* using `packages/ui` components, never copy-pasted from viewed source.

---

## 3. Mapping Shopify's model onto the Storeforge schema

### 3a. Current schema (`packages/db/prisma/schema.prisma`)
Today: `Product` (id, slug, name, price, timestamps), `Customer` (id, email, name), `Order`/`OrderItem`/`OrderStatus` (PENDING/PAID/FULFILLED/CANCELLED). No variants, no images, no collections. This is intentionally minimal — it's the shared template that every storefront starts from and extends (per `packages/db/README.md`: "every storefront copies `prisma/schema.prisma` into its own app and extends it").

### 3b. Shopify's model, for comparison
Shopify's core concepts: **Product** (parent, has options like Size/Color) → **Variant** (each option combination, own SKU/price/inventory/image) → **Collection** (curated or rule-based grouping, many-to-many with products) → **Image** (belongs to a product, optionally scoped to a specific variant) → **Customer**/**Order** roughly comparable to ours already.

### 3c. Gaps and where each extension belongs

| Gap | Extension needed | Belongs in `packages/db` or local to `apps/beautifulmess`? |
|---|---|---|
| No variants (Size/Color/etc.) | New `ProductVariant` model: `productId`, `sku`, `price` (override or delta), `optionValues` (e.g. JSON or a normalized `VariantOption` model), `stock` | **`packages/db`** — variants are not Beautiful-Mess-specific; almost any apparel/D2C client onboarded after this one will need the same shape. Per the Design Plan's rule of thumb ("benefits any storefront regardless of vertical") this is core, not local. |
| No product image gallery / multiple images per product | New `ProductImage` model: `productId`, `variantId?` (nullable — some images are variant-specific), `url`, `altText`, `sortOrder` | **`packages/db`** — same reasoning; every catalog-driven storefront needs more than a single implicit image. |
| No collections | New `Collection` model + `ProductCollection` join table (many-to-many), with `title`, `slug`, `description`, optionally a `sortOrder` | **`packages/db`** — collections/categories are a near-universal catalog need, not specific to this client's business. |
| Product `description` is currently absent entirely (only `name`/`price` exist) | Add `description` (text/HTML) field to `Product` | **`packages/db`** — core field missing from the current minimal template; every real catalog needs it. |
| Bundles/kits (if the "flag" checklist in 1g surfaces any live bundle products) | A `BundleItem` self-referencing join, or defer entirely | **Local to `apps/beautifulmess`** initially — not yet known to be a cross-client need; revisit at Stage 3 (extract reusable patterns) if a future client needs the same thing. |
| Subscriptions (if any exist — see Section 5) | Recurring-order concept, no current shape at all | **Local to `apps/beautifulmess`**, and only if the client decision in Section 1g/Section 5 says this is a launch requirement — this is a big enough addition that it should not be forced into the shared template speculatively. |
| Gift cards (if active ones exist) | `GiftCard` model + redemption logic in `packages/payments` or local | Redemption logic that touches payment flow — if built, treat as **local to `apps/beautifulmess` first**, since it's unproven and Razorpay doesn't have a native gift-card primitive; only graduate to `packages/payments` if a second client needs the same thing (Stage 3 discipline). |
| Beautiful-Mess-specific fields (e.g. a size chart specific to their garment types, fabric/care info, a specific return-window field) | Client-specific fields on `Product` or a side table | **Local to `apps/beautifulmess`** — textbook "client-specific business logic" per the Design Plan's rule of thumb. |

### 3d. Process for landing the `packages/db` extensions
Per `packages/db/README.md`'s stated model, core-entity changes "land here first and get re-copied outward." Practically: extend `packages/db/prisma/schema.prisma` with `ProductVariant`, `ProductImage`, `Collection`/`ProductCollection`, and `Product.description` as part of this migration (since Beautiful Mess is the first real catalog exercising this schema), write/extend `packages/db`'s own test coverage for the new models, then copy the updated `schema.prisma` into `apps/beautifulmess/prisma/schema.prisma` and add Beautiful-Mess-only fields on top of that local copy. Do **not** add Beautiful-Mess-only fields directly to the shared template.

Because this is the *first* client to actually populate a catalog, this migration is effectively also the moment the "minimal" schema needs to grow up — treat the variant/image/collection additions as core platform work (with their own tests, reviewed like any `packages/` change per the testing rules), not as a Beautiful-Mess side quest.

---

## 4. Theming — mapping Beautiful Mess's brand into the `ThemeProvider` contract

Per `packages/ui/README.md`, the entire branding surface for a storefront is one `StorefrontTheme` object passed to `ThemeProvider`:

```
colorBrand, colorBrandForeground, colorBackground, colorForeground,
colorMuted, colorBorder, fontSans
```

Work required:
1. From the Phase 1 content/asset audit, extract Beautiful Mess's actual brand palette (primary brand color, its foreground/contrast color, background, body text color, muted/secondary text color, border color) — either from their Shopify theme settings (if we get admin access) or by color-picking from the rendered site and their logo/brand assets as a fallback.
2. Resolve the font question from Section 1e (Google Fonts vs. licensed) into a concrete `fontSans` value.
3. Construct the `StorefrontTheme` object and wire it into `apps/beautifulmess/app/layout.tsx`, exactly as `apps/_template/app/layout.tsx` already demonstrates.
4. Verify against `theme-provider.test.tsx`'s enforcement mechanism expectations: no component should need to branch on this being "Beautiful Mess" specifically — if a component needs client-specific visual behavior beyond what CSS variables can express, that's a signal that either the theme contract needs a new variable (a `packages/ui` change, reviewed carefully since it affects every storefront) or the need is truly one-off and belongs as local layout/composition in `apps/beautifulmess`, not a component fork.
5. No expectation that this migration needs to *extend* the `ThemeProvider` contract itself — flag it only if the brand audit turns up something the current variable set genuinely can't express (e.g. a background image/texture rather than a flat color), and treat that as a `packages/ui` proposal to evaluate on its own merits, not bundle silently into this client's build.

---

## 5. Risks specific to this migration

**SEO impact of URL structure changes.** Shopify URLs are patterned as `/products/<handle>`, `/collections/<handle>`, `/pages/<handle>`. Decide during Phase 1 whether `apps/beautifulmess` mirrors this exact pattern (lowest SEO risk, straightforward redirect story) or adopts a different URL scheme (more flexibility, but requires a full 301 redirect map from every old Shopify URL to its new equivalent). Recommendation: **mirror Shopify's URL patterns** unless there's a strong reason not to, specifically to avoid needing a large redirect map and to preserve existing search rankings/backlinks. Regardless of the choice, a redirect map must be produced and tested before DNS cutover, and Google Search Console should have the new domain/property verified in advance so a sitemap resubmission can happen same-day as cutover.

**DNS cutover downtime risk.** A live commercial store cannot have meaningful downtime. Mitigate by: lowering the domain's DNS TTL well in advance of cutover (so the eventual change propagates fast), doing cutover during the client's lowest-traffic window, keeping the Shopify store live and unmodified (not deleted) for a defined parallel-run window after DNS points at the new app (rollback path: point DNS back if something breaks), and having a monitoring/alert plan (Sentry, per the stack) actively watched for the first 24–48 hours post-cutover.

**Losing Shopify-specific data — customer accounts and order history.** This needs an explicit client decision, not a default assumption:
- **Recommended default:** historical orders and customer accounts **stay on record in Shopify only** (Shopify remains accessible, read-only/archived, for as long as needed for accounting/support lookups) rather than attempting a full migration into the new `Customer`/`Order`/`OrderItem` schema. Migrating historical transactional data has real complexity (payment references, tax/invoice records, refund history) that doesn't map cleanly onto a schema built around Razorpay's `gatewayOrderId` idempotency key, since none of that historical data has one.
- **If the client needs customers to not have to "start over"** (e.g. to preserve a loyalty balance or simply spare them re-registering), migrate the customer *identity* record only (email, name — a much smaller, safer surface) and leave order history behind in Shopify archive access — do not attempt to backfill fabricated `Order` rows with synthetic `gatewayOrderId`s.
- This decision should be made explicitly with the client during Phase 1 and written down, since "did old orders come across" is exactly the kind of thing that generates a support ticket later if undecided.

**Active subscriptions / gift cards with no Storeforge equivalent.** If Phase 1's discovery (Section 1g) finds live subscriptions or unredeemed gift card balances, these are **launch blockers requiring a decision before cutover**, not something to quietly drop: either (a) honor them by keeping a lightweight bridge (e.g. a manual/semi-manual fulfillment process during a transition window while the feature gets built), (b) migrate affected customers to a one-time equivalent with clear communication, or (c) delay cutover until the necessary schema/feature work lands. Do not cut over DNS while an unresolved live subscription or redeemable gift-card balance exists with no destination.

**Payment gateway differences — Shopify Payments vs. Razorpay.** Customers will see a different checkout provider/UI; this is a normal part of any platform migration but should be communicated (a brief "what to expect" note at checkout during the transition period is reasonable). More materially: any saved payment methods / stored cards in Shopify Payments do **not** carry over — customers will need to re-enter payment details on their first order post-migration. Confirm Razorpay's supported methods (UPI, cards, netbanking, wallets) cover what Beautiful Mess's customer base actually uses (check current Shopify Payments method mix if the client can share it) before cutover, not after.

**Shiprocket vs. whatever Shopify shipping/courier setup is live today.** Confirm current courier relationships, any negotiated rates, and COD support (if used) carry over acceptably to Shiprocket before cutover — this is an operational risk, not just technical.

---

## 6. Phased rollout

**Phase 1 — Discovery & content audit.**
Request Shopify Admin CSV exports (and API access if warranted) from the client in writing, with a deadline. In parallel, do a manual audit of the live site's page structure, navigation, and static pages (Section 1f). Produce the Shopify-app-feature checklist (Section 1g) and get explicit client decisions on each. Extract brand colors/fonts and resolve the font licensing question (Section 1e). Decide the URL-structure and historical-data-migration questions (Section 5) with the client, in writing. **Exit criterion:** a written content inventory, a decided feature checklist, and a decided data/URL policy — nothing in Phase 2 starts until these are signed off, since they change the schema and scope.

**Phase 2 — Schema extension.**
Extend `packages/db/prisma/schema.prisma` with `ProductVariant`, `ProductImage`, `Collection`/`ProductCollection`, and `Product.description` (Section 3), with their own test coverage in `packages/db`. Copy the updated template into `apps/beautifulmess/prisma/schema.prisma` and layer on any Beautiful-Mess-only fields locally. Provision the client's Neon database.

**Phase 3 — Asset migration pipeline.**
Build the one-off import/upload tooling (lives in `apps/beautifulmess/scripts/`, not `packages/`): a script that reads the Phase 1 CSV/JSON export and (a) uploads images to the client's ImageKit account, rewriting URLs, and (b) transforms the export into seed data matching the Phase 2 schema. Run against a Neon branch first (per the stack's branching feature) to validate before touching the real database.

**Phase 4 — Theming.**
Build the `StorefrontTheme` object (Section 4) and wire `ThemeProvider` into `apps/beautifulmess/app/layout.tsx`. Confirm visually against the brand audit before catalog work makes it hard to isolate theming bugs from data bugs.

**Phase 5 — Catalog import.**
Run the Phase 3 pipeline against the real (or a Neon branch of the) `apps/beautifulmess` database. Spot-check a sample of products against the live Shopify site for accuracy (price, variants, images, description formatting).

**Phase 6 — Page-by-page rebuild.**
Scaffold `apps/beautifulmess` from `apps/_template` (if not already done as part of Phase 2). Rebuild homepage, PLP/collection pages, PDP, cart, checkout using `@storeforge/ui` components, and the static pages (About/FAQ/Returns/etc.) as plain content pages populated from the Phase 1 copy audit. Build the navigation from the captured nav tree.

**Phase 7 — Payment/shipping cutover configuration.**
Provision Beautiful-Mess-specific Razorpay and Shiprocket credentials (per the isolation-per-storefront rule). Wire and test both webhook routes end-to-end (mirroring `apps/_template`'s e2e purchase flow) against these real (test-mode) credentials.

**Phase 8 — DNS/domain cutover prep.**
Lower DNS TTL in advance. Prepare the redirect map (Section 5) if the URL scheme differs at all from Shopify's. Verify the new domain in Search Console. Set up Sentry/monitoring for `apps/beautifulmess` (per the stack) and confirm alerting is live before cutover, not after.

**Phase 9 — Parallel-run / QA period.**
Run `apps/beautifulmess` live on a staging subdomain (or Vercel preview) alongside the still-live Shopify store. Full e2e pass (browse → cart → checkout → Razorpay webhook → order status → Shiprocket webhook → fulfillment status), a11y check (`@axe-core/playwright`, per the platform's existing pattern), and a manual client walkthrough/sign-off against the Phase 1 content inventory (nothing missing, no broken variant/image mapping).

**Phase 10 — Go-live (DNS cutover).**
Point the domain's DNS at the new Vercel project during the agreed low-traffic window. Actively monitor Sentry/order flow for the first 24–48 hours. Keep rollback (repointing DNS back to Shopify) as a live option during this window.

**Phase 11 — Shopify deprecation.**
Once stable (a defined observation period, e.g. 2–4 weeks with no material issues), downgrade the Shopify store to read-only/archive mode per the Section 5 decision (rather than deleting it outright) so historical order/customer lookups remain possible. Cancel or downgrade the Shopify subscription per the client's own timeline/contract with Shopify — that's the client's commercial decision, not ours to execute unilaterally.

---

## 7. Open decisions the user needs to make before execution starts

1. **Data access route:** Will the client provide Shopify Admin CSV exports / API access, or do we need to plan on the public-storefront-crawl fallback (materially weaker data quality, no inventory/metafield/order-history access)? This gates the Phase 1 timeline.
2. **Font licensing:** Is Beautiful Mess's current theme font a Google Font (no issue) or a licensed/custom font (needs a license check or substitution)? Needs a direct question to the client.
3. **Shopify app feature checklist (Section 1g):** Which of reviews, upsells, subscriptions, loyalty, gift cards, back-in-stock, and bundles are actually live on beautifulmess.in today, and which does the client want at launch vs. deferred vs. dropped? This directly affects Phase 2 schema scope and could be a launch blocker (subscriptions/gift cards especially).
4. **Historical data policy:** Confirm the recommended default (orders/full history stay in Shopify archive; at most, customer identity — not order history — migrates) is acceptable to the client, or whether they require a fuller migration.
5. **URL structure:** Mirror Shopify's `/products/`, `/collections/`, `/pages/` patterns (recommended, lower SEO risk) or adopt a different scheme (requires a redirect map)?
6. **Cutover window:** What is the client's lowest-traffic period, and how long a parallel-run/QA window do they want before committing to DNS cutover?
7. **Payment method coverage:** Get current Shopify Payments method-mix data from the client (if available) to confirm Razorpay's UPI/card/netbanking/wallet coverage is acceptable to their customer base before cutover.
