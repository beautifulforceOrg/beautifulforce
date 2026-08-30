import { db } from "@storeforge/db";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "../../../../lib/session-token";
import { POST } from "./route";

const EMAIL = "push-token-test@example.com";
let customerId: string;

async function cleanup() {
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: EMAIL } });
  customerId = customer.id;
});

afterEach(() => vi.unstubAllGlobals());
afterAll(cleanup);

function tokenRequest(body: unknown, authenticated = true): Request {
  return new Request("http://localhost/api/mobile/push-token", {
    method: "POST",
    headers: authenticated ? { authorization: `Bearer ${createSessionToken(customerId)}` } : {},
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile/push-token", () => {
  it("saves the Expo push token against the authenticated customer", async () => {
    const response = await POST(tokenRequest({ token: "ExponentPushToken[abc123]" }));
    expect(response.status).toBe(200);

    const customer = await db.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.expoPushToken).toBe("ExponentPushToken[abc123]");
  });

  it("401s with no Authorization header", async () => {
    const response = await POST(tokenRequest({ token: "ExponentPushToken[abc123]" }, false));
    expect(response.status).toBe(401);
  });

  it("400s with no token", async () => {
    const response = await POST(tokenRequest({}));
    expect(response.status).toBe(400);
  });
});
