# Storeforge: Implementation Plan
*Stack, testing strategy, monorepo architecture, and rollout for an AI-agent-maintained, multi-storefront commerce platform*

## TL;DR
- **Monorepo (Turborepo, pnpm workspaces)** with `packages/` (shared core: UI, DB schema template, payments, shipping, config) and `apps/` (one isolated Next.js storefront per client) — see the Design Plan for the full architectural rationale.
- **Per storefront:** Next.js (App Router, TypeScript), its own Neon Postgres database, its own Vercel project and domain, Razorpay for payments, Shiprocket for shipping, ImageKit for images, Resend for email, Sentry for monitoring.
- **Realistic cost per storefront:** $0 while building (Vercel Hobby, non-commercial), **~$20–25/month once live** (Vercel Pro required for commercial use), plus per-transaction payment fees and per-shipment courier charges. Domain: ~₹800–1,200/year.
- **Testing is the substitute for a human code reviewer**, across the shared packages and every storefront app. Nothing reaches production without passing: lint → typecheck → unit tests → integration tests (real test DB) → e2e tests (real browser) → secret scan.

---

## PART 1 — MONOREPO ARCHITECTURE

### Repo structure
```
storeforge/
├── apps/
│   ├── storefront-a/
│   ├── storefront-b/
│   └── storefront-c/
├── packages/
│   ├── ui/              # shared cart, checkout, product grid components
│   ├── db/               # shared Prisma schema template
│   ├── payments/          # shared Razorpay integration logic
│   ├── shipping/           # shared Shiprocket integration logic
│   └── config/              # shared TypeScript/ESLint/Tailwind config
├── turbo.json
└── pnpm-workspace.yaml
```

### Tooling
- **Turborepo** over Nx: for a handful of client storefronts rather than dozens of internal teams, Turborepo's minimal-configuration, cache-first design is the right complexity level and is quick to set up.
- **Remote caching** via Vercel's free tier: unchanged packages are never rebuilt; CI stays fast as more storefronts are added.
- **pnpm workspaces**: each `apps/<client>` and `packages/<name>` is a workspace member; shared packages are referenced via `workspace:*` so every app always builds against the current in-repo version.

### Isolation boundaries (per storefront)
| Isolated per client | Shared across all clients |
|---|---|
| Postgres database (Neon) | UI component library |
| Domain + Vercel project | Payment/shipping integration logic |
| Environment variables/API keys | TypeScript/lint/test configuration |
| Product catalog & order data | CI pipeline definition |
| Branding, theming, business-specific logic | Testing conventions and utilities |

### Change propagation
Editing a shared package → Turborepo's dependency graph identifies affected storefront apps → each affected app rebuilds and runs its own test suite → only apps that pass redeploy. A shared-code change never reaches a storefront it hasn't been independently verified against.

### What goes where
- **`packages/`**: anything that would benefit any storefront regardless of vertical or branding — a checkout bug fix, a more resilient webhook handler, a faster image-loading pattern.
- **`apps/<client>/`**: anything specific to one client's business — their catalog schema extensions, a custom loyalty program, brand-specific UI, one-off business rules.

---

## PART 2 — TECHNOLOGY STACK (per storefront)

| Layer | Recommendation | Free-tier / entry cost | Why it fits an AI-agent-maintained platform |
|---|---|---|---|
| **Frontend + Backend** | **Next.js 15/16, App Router, TypeScript** | Free (framework) | Most-represented framework in AI training data; one repo, one deploy, one test suite |
| **UI** | **Tailwind CSS + shadcn/ui**, shared via `packages/ui` | Free | AI has strong priors; standardized, reusable component patterns |
| **Database** | **Neon serverless Postgres**, one instance per storefront | Free tier (0.5 GB, scale-to-zero, branching) | Postgres is the most AI-legible database; branching allows safe migration testing per storefront |
| **ORM/migrations** | **Prisma**, schema template in `packages/db` | Free | Declarative migrations, shadow-DB safety, destructive-change warnings |
| **Hosting/deploy** | **Vercel**, India region (Mumbai/bom1), one project per storefront | Pro **$20/mo per storefront** (Hobby forbids commercial use) | Best CLI/preview/rollback DX; native Next.js; India edge nodes |
| **Payments** | **Razorpay hosted/standard checkout**, shared integration in `packages/payments` | No setup/annual fee; 2%+GST domestic, UPI 0% | Best-documented India API; SAQ A scope; RBI-compliant tokenization handled by Razorpay |
| **Images/CDN** | **ImageKit**, per-storefront account | Free (20 GB bandwidth, 3 GB storage) | India-based delivery; URL-based transforms; simple SDK |
| **Auth** | **Supabase Auth** (or Clerk) | 50k MAU free / 10k MAU free | Cookie/SSR support; AI-standard patterns |
| **Email** | **Resend** | 3,000/mo free | React Email; cleanest AI-friendly API |
| **WhatsApp** | **Interakt** (or AiSensy free starter) | ~₹999+/mo + Meta per-msg | High-open-rate order/shipping notifications, standard for Indian D2C |
| **Shipping** | **Shiprocket API**, shared integration in `packages/shipping` | Pay-per-shipment; API tier ~₹499/mo | One API for many couriers, no minimums |
| **Domain** | **Cloudflare Registrar or Namecheap**, per storefront | ~₹800–1,200/year incl. GST | No renewal-price markup |
| **Monitoring** | **Sentry**, one project per storefront | Free (5k errors/mo) | Alerts substitute for a human watching logs |

---

## PART 3 — TESTING STRATEGY

### Why this matters more in a shared-platform model
A bug introduced into a shared package doesn't just affect one storefront — it can affect every storefront that imports it. The test suite is the mechanism that makes shared-code changes safe to ship across multiple independent businesses without a human reviewing every line.

### The testing pyramid
```
        ┌───────────────────────────┐
        │  E2E tests (Playwright)   │  ← few, slow, full browser, per storefront
        └───────────────────────────┘
     ┌─────────────────────────────────┐
     │      Integration tests          │  ← Prisma + real test database, per storefront
     └─────────────────────────────────┘
┌───────────────────────────────────────────┐
│   Unit tests (Vitest) — packages/ + apps/  │  ← most tests, fastest feedback
└───────────────────────────────────────────┘
```

**Shared packages get their own test suite, run independently of any storefront.** `packages/ui`, `packages/payments`, and `packages/shipping` each ship with unit and integration tests that verify correctness in isolation — before any storefront app even imports the change.

### 1. Unit testing — Vitest
Chosen for speed (10–20x faster startup than Jest), native TypeScript/ESM support, and clean, AI-readable error output. Test pure logic in isolation: pricing/cart calculations, Zod validation schemas, and business logic inside Server Actions.

```typescript
// packages/payments/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCartTotal } from './pricing';

describe('calculateCartTotal', () => {
  it('sums item prices correctly', () => {
    const items = [{ price: 5500, qty: 1 }, { price: 1200, qty: 2 }];
    expect(calculateCartTotal(items)).toBe(7900);
  });
  it('returns 0 for an empty cart', () => {
    expect(calculateCartTotal([])).toBe(0);
  });
});
```

### 2. Integration testing — real per-storefront test database, mocked external APIs
Each storefront's integration tests run against an isolated test database (a Neon branch created per CI run, or local Postgres via Docker) — never a mock of Prisma itself, since mocking would never catch a bad migration or wrong foreign key.

```typescript
// apps/storefront-a/tests/integration/orders.test.ts
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from '@/lib/db';

beforeEach(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
});

it('creates an order with correct line items', async () => {
  const product = await db.product.create({ data: { name: 'Item', price: 5500, slug: 'item-1' } });
  const order = await db.order.create({
    data: { items: { create: [{ productId: product.id, quantity: 1 }] } },
    include: { items: true },
  });
  expect(order.items).toHaveLength(1);
});
```

External APIs (Razorpay, Shiprocket, ImageKit) are mocked with **MSW (Mock Service Worker)** inside `packages/payments` and `packages/shipping`'s own test suites, so no storefront's tests depend on network access or real API accounts.

### 3. Payment webhook idempotency — tested once, shared everywhere
Because the webhook handling logic lives in `packages/payments`, the idempotency test is written **once** and protects every storefront that uses it — a critical efficiency of the shared-core model.

```typescript
// packages/payments/tests/webhook-idempotency.test.ts
it('does not create a duplicate order on a repeated webhook', async () => {
  const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test1', order_id: 'order_1' } } } };
  await POST(mockRequest(payload));   // first delivery
  await POST(mockRequest(payload));   // gateway redelivers the same event
  const orders = await db.order.findMany({ where: { gatewayOrderId: 'order_1' } });
  expect(orders).toHaveLength(1);
});
```

### 4. E2E/UI testing — Playwright (per storefront)
Playwright is chosen over Cypress specifically for the AI-agent-driven maintenance model: in head-to-head testing, AI-generated Playwright tests succeeded on the first try 94% of the time versus 71% for Cypress, and Playwright's Trace Viewer (captured post-run, no live human required) is purpose-built for the "nobody was watching when it failed in CI" situation this platform lives in.

```typescript
// apps/storefront-a/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('customer can complete a purchase', async ({ page }) => {
  await page.goto('/products/sample-item');
  await page.click('text=Add to cart');
  await page.click('text=Checkout');
  await page.fill('#email', 'test@example.com');
  await page.fill('#card-number', '4111 1111 1111 1111');  // Razorpay test card
  await page.click('text=Pay now');
  await expect(page.locator('text=Order confirmed')).toBeVisible();
});
```
Each storefront's e2e suite covers: browse → filter/search → add to cart → checkout → order confirmation, run independently since each has its own domain and data.

### 5. Accessibility & security
```typescript
// apps/storefront-a/e2e/a11y.spec.ts
import AxeBuilder from '@axe-core/playwright';
test('product page has no accessibility violations', async ({ page }) => {
  await page.goto('/products/sample-item');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
- Prisma parameterizes queries by default — ban `$queryRawUnsafe` with interpolated input across the whole monorepo.
- React escapes rendered content by default — ban `dangerouslySetInnerHTML` unless explicitly reviewed.
- `gitleaks` runs in CI across the entire monorepo, catching accidental key commits in any package or app.

### The AI agent test loop
```
Claude Code makes a change (in packages/ or a specific apps/<client>/)
        │
Runs the affected test suites locally (Vitest + Playwright)
        │
   ┌────┴─────┐
Tests fail   Tests pass
   │             │
Fixes code,   Commits & opens PR
tries again        │
   │          CI re-runs affected suites (Turborepo filters to what changed)
   └──────────┐    │
              Vercel preview deploy(s) — one per affected storefront
                   │
              Human eyeballs preview(s)
                   │
              Merge → each affected storefront redeploys independently
```

### Recommended CI pipeline
```yaml
# .github/workflows/ci.yml
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npx turbo run lint --filter=...[origin/main]
      - run: npx turbo run typecheck --filter=...[origin/main]
      - run: npx prisma migrate deploy
      - run: npx turbo run test --filter=...[origin/main]
      - run: npx playwright install --with-deps
      - run: npx turbo run test:e2e --filter=...[origin/main]
      - run: npx gitleaks detect
```
The `--filter=...[origin/main]` pattern is the key platform-specific addition: only packages and apps affected by the change in this PR are linted, typechecked, and tested — keeping CI fast even as more storefronts are added to the monorepo, while still gating every affected storefront's deploy behind its own passing tests.

### CLAUDE.md — testing and scope rules
```markdown
## Testing rules
- Every new feature: write a failing test first, then implement.
- Never mark a task complete without running:
  npx turbo run typecheck test test:e2e --filter=...[origin/main]
- Payment webhook handlers (packages/payments) must have an
  idempotency test — duplicate event → no duplicate order.
- Never use `$queryRawUnsafe` or `dangerouslySetInnerHTML`.

## Scope rules
- A change that benefits only one client's business logic belongs
  in that client's apps/<client>/ folder — never in packages/.
- A change to packages/ affects every storefront — treat it with
  extra care and make sure its own test suite covers the change
  before considering the task done.
- Only touch files required for the current task — flag unrelated
  issues instead of fixing them inline.
- If the same test fails 3 times in a row, stop and report —
  do not keep guessing.
- Payment, auth, and data-deletion code changes require explicit
  human confirmation before merge, even if tests pass.
```

---

## PART 4 — ROLLOUT PLAN

**Stage 0 — Platform foundation.** Scaffold the Turborepo monorepo with `packages/` (ui, db, payments, shipping, config) as empty-but-tested skeletons. Set up GitHub Actions CI with the `--filter` pattern above as a required check before any storefront-specific code is written. Write the platform-level `CLAUDE.md`.

**Stage 1 — First storefront.** Build the first client's `apps/<client>` — catalog, cart, checkout — pulling shared logic into `packages/` as it's written, not after the fact. This storefront is also where the initial versions of `packages/payments` and `packages/shipping` are built and tested.

**Stage 2 — Checkout + payments + fulfillment for storefront one.** Razorpay integration (with webhook idempotency test) and Shiprocket integration land in their respective shared packages, consumed by the first storefront. Full e2e coverage for the purchase flow.

**Stage 3 — Extract reusable patterns.** Once the first storefront is stable and live, review what's genuinely reusable versus what was accidentally storefront-specific — refactor `packages/` accordingly before onboarding a second client. This step is easy to skip and expensive to skip; do it deliberately.

**Stage 4 — Onboard a second storefront.** New `apps/<client-2>` scaffolded from the now-proven shared packages. This is the first real test of whether the shared-core model is paying off: the second storefront should take meaningfully less time to build than the first.

**Stage 5 — Ongoing: shared improvements benefit all storefronts.** Bug fixes and improvements to `packages/` are tested once, verified against every affected storefront's own test suite, and redeploy independently per storefront.

**Benchmarks that change the plan:**
- A storefront's needs diverge significantly from the shared model (a fundamentally different catalog structure, a different vertical) — keep that logic local to its `apps/` folder rather than forcing it into `packages/`.
- Free-tier limits bite for a specific storefront — upgrade that storefront's specific service tier, not the whole platform.
- CI time grows uncomfortably as more storefronts are added — verify the `--filter` scoping is actually working as intended before adding infrastructure.

---

## PART 5 — CLIENT EXIT / EXTRACTION PROCESS

When a client's engagement ends, their storefront needs to become a fully standalone, working codebase — no dependency on the ongoing platform.

```
Client wants to leave
        │
Fork client's app folder + a snapshot of the shared packages it depends on
        │
Standalone repo created — independent of the monorepo
        │
Delivered to the client — they own it going forward
```

**Technical process:**
```bash
# Extract the client's app as its own git history
git subtree split --prefix=apps/<client> -b extract/<client>

# Inline the packages/* it depends on as local code rather than
# workspace references, so the resulting repo has zero dependency
# on the ongoing monorepo or its future changes.
```
The result is a point-in-time snapshot: fully functional, fully theirs, but no longer receiving future improvements to the shared platform, and with no ongoing dependency back into it either. See the Design Plan's IP & Legal Structure section for the contractual terms that should govern this handoff (background IP retained by the platform operator; the extracted snapshot assigned or licensed to the departing client).

## Caveats
- **A non-technical owner cannot fully verify AI-written code** — the test suite and CI gate are the structural mitigation, not a guarantee. Changes to shared packages, payments, and auth should get a second look before merging, even when tests pass.
- **Shared-package changes carry cross-storefront risk** by design — this is the trade-off for reuse, and it's exactly why the testing strategy in Part 3 treats `packages/` test coverage as non-negotiable.
- **Free-tier fragility applies per storefront** — each new client added to the platform brings its own free-tier ceilings (Vercel bandwidth, Neon compute-hours, ImageKit bandwidth) to track individually.
- **Pricing figures are point-in-time (2025–2026)** — verify current tiers before committing, especially for each new storefront onboarded.
