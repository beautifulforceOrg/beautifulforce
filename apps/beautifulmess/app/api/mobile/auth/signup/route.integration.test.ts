import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { verifySessionToken } from "../../../../../lib/session-token";
import { POST } from "./route";

const EMAIL = "mobile-signup-test@example.com";

function signupRequest(body: unknown): Request {
  return new Request("http://localhost/api/mobile/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function cleanup() {
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("POST /api/mobile/auth/signup", () => {
  it("creates a customer and returns a valid session token", async () => {
    const response = await POST(signupRequest({ email: EMAIL, password: "correct horse battery", name: "Mobile Tester" }));
    expect(response.status).toBe(200);

    const body = await response.json();
    const customer = await db.customer.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(customer.name).toBe("Mobile Tester");
    expect(verifySessionToken(body.token)).toBe(customer.id);
  });

  it("409s when the email already has a password set", async () => {
    await POST(signupRequest({ email: EMAIL, password: "correct horse battery" }));
    const response = await POST(signupRequest({ email: EMAIL, password: "another password" }));
    expect(response.status).toBe(409);
  });

  it("400s for a password under 8 characters", async () => {
    const response = await POST(signupRequest({ email: EMAIL, password: "short" }));
    expect(response.status).toBe(400);
  });
});
