import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // preview-smoke.spec.ts is written exclusively for a real deployed
  // Vercel Preview (see its own header comment and
  // playwright.preview.config.ts / `pnpm run test:e2e:preview`) -- it
  // was never excluded here, so it's been silently running against
  // this config's local webServer instead (confirmed: it showed up
  // failing in earlier full-suite runs, dismissed then as generic
  // flakiness). It asserts things -- like zero failed network requests
  // -- that only hold on a real Vercel deployment (e.g. the Vercel
  // Analytics script `_vercel/insights/script.js` 404s under a local
  // `next start`, since that path is served by Vercel's platform, not
  // this app).
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3200",
  },
  webServer: {
    // .env.test.local (gitignored, see .env.test.local.example) layers
    // real secrets -- e.g. RAZORPAY_KEY_SECRET, E2E_MOCK_EXTERNAL_APIS=0
    // -- on top of .env.test's safe defaults, without either ever being
    // committed. dotenv-cli tolerates the file being absent, so this is
    // safe as the default command even when it doesn't exist yet.
    //
    // A real production build+start, not `next dev`: dev mode's Fast
    // Refresh triggers unrequested full-page reloads under concurrent
    // load (confirmed via dev-server logs -- "Fast Refresh had to
    // perform a full reload"), which raced against Playwright's own
    // page.goto() calls and surfaced as "Navigation to X is interrupted
    // by another navigation to Y" -- a real, reproducible source of e2e
    // flakiness across the full 3-browser admin suite, not a shared-
    // AdminUser-row issue as originally suspected (see
    // docs/technical-debt.md history). Production mode has no HMR/Fast
    // Refresh at all, so this entire class of failure can't happen.
    command: "dotenv -e .env.test.local -e .env.test -- pnpm run build && dotenv -e .env.test.local -e .env.test -- pnpm run start",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 180_000,
  },
  // The full suite runs on all three desktop engines -- Chromium (also
  // covers Brave/Edge, which share the same engine), Firefox, and WebKit
  // (Safari's engine). mobile.spec.ts additionally runs under real
  // iOS/Android device emulation (viewport, touch events, user agent) so
  // it exercises the mobile menu and touch interactions the desktop
  // projects can't.
  //
  // Each project's testIgnore replaces (not merges with) a top-level
  // one, so preview-smoke.spec.ts's exclusion (see the file's own header
  // comment -- it's written exclusively for a real deployed Vercel
  // Preview, via playwright.preview.config.ts / `test:e2e:preview`) has
  // to be listed on every project here too, not just once above.
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: [/mobile\.spec\.ts/, /preview-smoke\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-firefox",
      testIgnore: [/mobile\.spec\.ts/, /preview-smoke\.spec\.ts/],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "desktop-safari",
      testIgnore: [/mobile\.spec\.ts/, /preview-smoke\.spec\.ts/],
      use: { ...devices["Desktop Safari"] },
    },
    { name: "mobile-ios", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 13"] } },
    { name: "mobile-android", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
});
