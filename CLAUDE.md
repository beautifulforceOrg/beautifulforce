# Storeforge

A monorepo of independently isolated D2C storefronts (`apps/*`) sharing one
tested core (`packages/*`). See `storeforge-design-plan.md` and
`storeforge-implementation-plan.md` for the full architectural rationale.

## Testing rules

- Every new feature: write a failing test first, then implement.
- Never mark a task complete without running:
  `pnpm turbo run typecheck test test:e2e`
  (CI scopes this to `--filter=...[origin/<base-branch>]` on a pull request
  for speed -- see `.github/workflows/ci.yml` -- but locally, without a
  guaranteed remote to diff against, run the full suite.)
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

## Isolation

Each storefront has its own database, domain, Vercel project, and
credentials — never shared with another storefront. Only code in
`packages/` is shared.

## Architecture diagrams -- keep them current

`docs/architecture.md` is the source of truth for how code flows through
this monorepo: a high-level system diagram, the package dependency graph,
the purchase-flow sequence, and one diagram per package/app (schema,
theming, webhook idempotency, status mapping, the catalog import
pipeline, CI). It is also published as an Artifact for easier browsing:

**Storeforge Architecture** — https://claude.ai/code/artifact/8a021a1c-ca11-49f5-859e-273974119246

**Whenever a change alters something a diagram depicts**, update both
before considering the task done:

- A new package or app, or a new dependency between existing ones →
  diagrams 1–2
- A change to the checkout/payment/fulfillment flow, or to which webhook
  composition an app uses → diagram 3
- A `packages/db` schema change → diagram 4
- A `packages/ui` theming-contract change → diagram 5
- A change to `packages/payments`' or `packages/shipping`'s webhook logic
  → diagrams 6–7
- A change to how `apps/beautifulmess` (or a future client app) imports
  its catalog → diagram 8
- A CI pipeline change → diagram 9

To update:

1. Edit the Mermaid source in `docs/architecture.md` directly.
2. Copy the same Mermaid block(s) into the matching `<pre class="mermaid">`
   section of the artifact's HTML source (currently authored at
   `/private/tmp/claude-502/-Users-satish-code-src-beautifulforce/bee8ddb1-221c-4942-a0ee-ddd1078afd71/scratchpad/storeforge-architecture.html`
   in the session that published it -- if that path is gone, use
   `Artifact` with `action: "read"` on the URL above to recover the
   current HTML, edit it, and save it to a new local file first).
3. Republish with `Artifact`, passing the URL above as `url` so it updates
   in place rather than creating a new artifact.

A new diagram (a new package, a new kind of flow) gets a new numbered
section in both places, plus a `<a class="navlink">` entry in the
artifact's nav and a wakeup in this file's list above.

## Vercel plugin -- use it for Vercel-side work

The [Vercel plugin for AI coding agents](https://vercel.com/docs/agent-resources/vercel-plugin)
is installed (user scope, `vercel@claude-plugins-official`) and the
`vercel` CLI is on `PATH` (installed via `bun install -g vercel`, run from
a shell with `~/.bun/bin` on `PATH`). Prefer it over ad hoc `vercel`
invocations or guessing at deploy/env behavior for anything touching a
real Vercel project:

- **Env vars**: `/vercel-plugin:env` (list/pull/add/remove/diff) instead
  of hand-editing Vercel's dashboard or guessing var names — this is the
  right tool whenever a task needs a new `.env.test.local.example` value
  (Razorpay, Shiprocket, ImageKit, Google Maps, `ADMIN_ALLOWED_EMAILS`,
  etc.) actually set on a real deployment, not just documented locally.
- **Deploys**: `/vercel-plugin:deploy` for a preview, `/vercel-plugin:deploy prod`
  for production. Production deploys are still a "confirm before acting"
  action per this session's general risk rules — don't run it unprompted.
- **Status**: `/vercel-plugin:status` for a project's recent deployments
  and env overview instead of `vercel ls`/manual dashboard checks.
- **Bootstrapping a new client app's Vercel project**: `/vercel-plugin:bootstrap`
  — relevant the next time a storefront (e.g. `apps/beautifulsilver`) is
  actually connected to a real Vercel project/domain, per the Isolation
  rule above (own project, own domain, own credentials).
- Specialist agents available on demand: `deployment-expert` (CI/CD,
  deploy strategy, env troubleshooting), `performance-optimizer` (Core Web
  Vitals, caching, asset optimization — useful for this repo's existing
  Lighthouse-driven work, see `apps/beautifulmess`'s past `fetchPriority`
  fix), `ai-architect` (not yet relevant here — no AI/LLM features exist
  in this codebase today).
- **Prerequisite**: the CLI must be logged in (`vercel whoami`) before any
  of the above can touch a real project — if it isn't, ask the user to run
  `vercel login` (interactive) rather than attempting to authenticate on
  their behalf.
- The plugin's skills (`nextjs`, `vercel-functions`, `env-vars`,
  `deployments-cicd`, `react-best-practices`, etc.) are available on
  demand even without a slash command — reach for them over general
  knowledge when a question is specifically about Vercel/Next.js platform
  behavior (caching semantics, Edge vs. Node runtime, deployment
  protection, etc.).
