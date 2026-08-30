import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3300",
  },
  webServer: {
    command: "dotenv -e .env.test -- next dev -p 3300",
    url: "http://localhost:3300",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
