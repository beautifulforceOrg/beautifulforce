import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3200",
  },
  webServer: {
    command: "dotenv -e .env.test -- next dev -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  // Desktop Chromium runs the full suite; mobile.spec.ts additionally runs
  // under real iOS/Android device emulation (viewport, touch events, user
  // agent) so it exercises the mobile menu and touch interactions the
  // desktop project can't.
  projects: [
    { name: "desktop", testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile-ios", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 13"] } },
    { name: "mobile-android", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
});
