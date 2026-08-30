import { request } from "@playwright/test";

// Vercel's Deployment Protection blocks unauthenticated requests to
// Preview deployments. This exchanges VERCEL_PREVIEW_BYPASS_SECRET for
// the _vercel_jwt cookie once, up front, and saves it as Playwright
// storage state so every test in the run starts already past the wall
// -- see .env.test.local.example for where the secret itself lives.
export default async function globalSetup() {
  const baseURL = process.env.PREVIEW_BASE_URL;
  const bypassSecret = process.env.VERCEL_PREVIEW_BYPASS_SECRET;
  if (!baseURL || !bypassSecret) {
    throw new Error("PREVIEW_BASE_URL and VERCEL_PREVIEW_BYPASS_SECRET must both be set to run preview e2e tests.");
  }

  const context = await request.newContext();
  const response = await context.get(baseURL, {
    headers: {
      "x-vercel-protection-bypass": bypassSecret,
      "x-vercel-set-bypass-cookie": "true",
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to bypass Vercel Deployment Protection: ${response.status()}`);
  }

  await context.storageState({ path: "e2e/.preview-storage-state.json" });
  await context.dispose();
}
