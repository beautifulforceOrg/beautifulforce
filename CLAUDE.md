# Storeforge

A monorepo of independently isolated D2C storefronts (`apps/*`) sharing one
tested core (`packages/*`). See `storeforge-design-plan.md` and
`storeforge-implementation-plan.md` for the full architectural rationale.

## Testing rules

- Every new feature: write a failing test first, then implement.
- Never mark a task complete without running:
  `pnpm turbo run typecheck test test:e2e --filter=...[origin/main]`
- Payment webhook handlers (`packages/payments`) must have an idempotency
  test — a duplicate delivered event must never create a duplicate order.
- Never use `$queryRawUnsafe` with interpolated input, or
  `dangerouslySetInnerHTML` without an explicit reviewer justification.
  Both are enforced by the root ESLint config.

## Scope rules

- A change that benefits only one client's business logic belongs in that
  client's `apps/<client>/` folder — never in `packages/`.
- A change to `packages/` affects every storefront that imports it — treat
  it with extra care, and make sure its own test suite covers the change
  before considering the task done.
- Only touch files required for the current task — flag unrelated issues
  instead of fixing them inline.
- If the same test fails three times in a row, stop and report — do not
  keep guessing.
- Payment, auth, and data-deletion code changes require explicit human
  confirmation before merge, even if tests pass.

## Isolation

Each storefront has its own database, domain, Vercel project, and
credentials — never shared with another storefront. Only code in
`packages/` is shared.
