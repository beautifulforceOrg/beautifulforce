# Storeforge: Design Plan

*A multi-tenant, AI-agent-maintained commerce platform for Indian D2C storefronts*

## Vision

Storeforge is a shared technical platform for building and running multiple independent D2C e-commerce storefronts in India. Each storefront looks, feels, and operates as a fully custom store to its owner and customers — its own domain, branding, catalog, and data — while drawing from one shared, continuously-improving core codebase underneath. An improvement made for one storefront (a faster checkout flow, a better cart UI, a new shipping integration) becomes available to every other storefront without being rebuilt from scratch.

The platform is designed to be built and maintained primarily by an AI coding agent (Claude Code), with no dedicated human developer reviewing every change, for non-technical store owners who cannot themselves evaluate code changes.

## Core Design Principles

1. **One shared core, many isolated storefronts.** Code is shared; data, domains, and infrastructure are not. No storefront's data is ever physically stored alongside another's.
2. **AI-agent-legible by default.** Every technology choice favors clarity and strong AI training-data priors over cleverness or novelty — the deciding factor in any close technical call is "can an AI agent maintain this safely without a human in the loop."
3. **Tests are the reviewer.** Because no human reviews every change, the automated test suite and CI gate are the actual safety mechanism, not a nice-to-have.
4. **Minimal fixed cost, especially pre-revenue.** Every layer defaults to a free tier; paid tiers are adopted only when a specific limit is actually hit.
5. **Legally separable by design.** Any single storefront can be extracted into a fully standalone, client-owned codebase without unwinding the shared platform — this is a first-class requirement, not an afterthought.

## High-Level Architecture

```
storeforge/
├── apps/
│   ├── storefront-a/        # one client's storefront: branding, catalog, config
│   ├── storefront-b/         # a second client's storefront
│   └── storefront-c/          # a third client's storefront
├── packages/
│   ├── ui/                    # shared cart, checkout, product grid components
│   ├── db/                     # shared Prisma schema template
│   ├── payments/                # shared Razorpay integration logic
│   ├── shipping/                 # shared Shiprocket integration logic
│   └── config/                    # shared TypeScript/ESLint/Tailwind config
├── turbo.json
└── pnpm-workspace.yaml
```

**Monorepo, not multi-tenant single app.** Storeforge is a **monorepo of independent apps sharing packages** — not one application serving multiple tenants from a shared database. Each storefront gets:

- Its own Next.js app inside `apps/`
- Its own Postgres database (Neon), never shared with another storefront
- Its own domain and its own Vercel project
- Its own environment variables (Razorpay keys, Shiprocket credentials, etc.)

What *is* shared is code: UI components, business logic, integration patterns, testing conventions — everything in `packages/`.

**Why not a true multi-tenant app?** A single shared database with a `tenant_id` column is more storage-efficient, but it creates two problems this platform is specifically designed to avoid: (1) a bug in tenant-isolation logic can leak one client's data to another — a catastrophic, hard-to-fully-rule-out failure mode for an AI-agent-maintained system with no dedicated security review; (2) it makes a clean legal/technical exit for a single client far harder, since their data is physically entangled with others'. Per-storefront isolation trades some infrastructure efficiency for materially lower risk and materially simpler legal separability — the right trade for this platform's operating model.

**Change propagation.** When a shared package changes (e.g., an improvement to `packages/ui`), Turborepo's dependency graph identifies every storefront app that imports it. Each affected app rebuilds and re-runs its own test suite; only apps that pass their own tests redeploy. A change never ships to a storefront it hasn't been verified against.

## Multi-Client Operating Model

**Onboarding a new storefront:**

1. Scaffold a new app under `apps/<new-client>` from a template that already imports the shared packages.
2. Provision a new Neon database, a new domain, and new Razorpay/Shiprocket credentials specific to that client.
3. Customize branding, catalog schema extensions, and any client-specific business logic inside that app only — never inside `packages/`.
4. Client-specific one-off features stay in the client's own app folder; only genuinely reusable improvements graduate into `packages/`.

**A rule of thumb for what belongs in** `packages/` **vs. a specific** `apps/` **folder:** if a change would benefit any storefront regardless of its vertical or branding (a bug fix in the checkout flow, a more resilient webhook handler), it belongs in `packages/`. If a change is specific to one client's business rules (a size chart specific to their product line, a custom loyalty program), it stays local to that client's app.

## IP & Legal Structure

This is a first-class design constraint, not a legal afterthought bolted on later.

**Two-tier IP split, standard in white-label/platform businesses:**

- **Background IP** — the shared platform (`packages/`, the monorepo tooling, the testing/CI conventions). Owned outright by the platform operator, across all clients, indefinitely. Under Indian copyright law, this ownership does not need to be assigned away by default — the developer/agency retains copyright on work it creates unless a contract explicitly transfers it, which is the opposite of the U.S. "work made for hire" assumption many people carry over by habit.
- **Foreground IP** — each client's specific storefront (their `apps/<client>` folder, their branding, their catalog data, their customizations). Licensed or assigned to that client per the terms of their individual contract.

**Every client contract should explicitly state, in writing:**

1. The platform operator owns the shared framework (background IP) perpetually, across all current and future clients.
2. The client receives a non-exclusive license to use the shared framework *as embedded in their storefront*, for the life of the engagement.
3. On termination, the client receives an assignment (or perpetual license, negotiable) of a **standalone, extracted snapshot** of their specific storefront — not a live, ongoing share of the platform.
4. The client does not receive rights to resell, relicense, or redistribute the underlying shared framework.
5. Exit/extraction is a defined, scoped deliverable (see the exit process in the implementation plan) — pricing this in upfront avoids negotiating it under pressure during an actual departure.

**This structure should be reviewed and formalized by an Indian IP/technology lawyer as a proper Master Services Agreement with a Background IP / Foreground IP schedule** before onboarding a second client — the design above describes the shape of the right answer, not a substitute for that review.

## Non-Goals (explicitly out of scope for this design)

- Storeforge is not a public SaaS product with self-serve signup — clients are onboarded manually by the platform operator.
- Storeforge does not pool inventory, payments, or customer data across storefronts — each is a fully independent business.
- **Storeforge does not attempt full automated multi-tenant billing/metering — each storefront's hosting and service costs are tracked and billed per client individually while volumes are small.**

## Next Document

See **Storeforge: Implementation Plan** for the specific technology stack, testing strategy, CI/CD pipeline, rollout stages, and the technical extraction process for client exits.
