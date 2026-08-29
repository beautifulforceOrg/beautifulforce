import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
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
    command: "dotenv -e .env.test.local -e .env.test -- next dev -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  // The full suite runs on all three desktop engines -- Chromium (also
  // covers Brave/Edge, which share the same engine), Firefox, and WebKit
  // (Safari's engine). mobile.spec.ts additionally runs under real
  // iOS/Android device emulation (viewport, touch events, user agent) so
  // it exercises the mobile menu and touch interactions the desktop
  // projects can't.
  projects: [
    { name: "desktop-chromium", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
    { name: "desktop-safari", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Safari"] } },
    { name: "mobile-ios", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 13"] } },
    { name: "mobile-android", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
});
