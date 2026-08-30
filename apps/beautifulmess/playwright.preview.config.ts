import { defineConfig } from "@playwright/test";

// Tests a real deployed Vercel Preview -- no local webServer, no
// mocking. Exercises the actual serverless functions, the real Neon
// preview branch, and real ImageKit-hosted images, which is exactly
// the class of environment that caught the Prisma-engine and
// fetchPriority bugs no local test ever could. Deliberately a smaller,
// faster smoke subset (e2e/preview-smoke.spec.ts only) rather than the
// full local suite -- see that file's header comment.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /preview-smoke\.spec\.ts/,
  globalSetup: "./e2e/preview-global-setup.ts",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.PREVIEW_BASE_URL,
    storageState: "e2e/.preview-storage-state.json",
  },
});
