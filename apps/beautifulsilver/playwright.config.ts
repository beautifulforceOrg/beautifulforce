import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3300",
  },
  webServer: {
    // .env.test.local (gitignored, see .env.test.local.example) layers
    // real secrets on top of .env.test's safe defaults, without either
    // ever being committed. dotenv-cli tolerates the file being absent,
    // so this is safe as the default command even when it doesn't exist.
    command: "dotenv -e .env.test.local -e .env.test -- next dev -p 3300",
    url: "http://localhost:3300",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
