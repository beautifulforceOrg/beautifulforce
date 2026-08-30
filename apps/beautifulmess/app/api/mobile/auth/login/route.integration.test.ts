import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "../../../../../lib/auth";
import { verifySessionToken } from "../../../../../lib/session-token";
import { POST } from "./route";

const EMAIL = "mobile-login-test@example.com";
const PASSWORD = "correct horse battery";

function loginRequest(body: unknown): Request {
  return new Request("http://localhost/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function cleanup() {
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

beforeEach(async () => {
  await cleanup();
  await db.customer.create({ data: { email: EMAIL, passwordHash: hashPassword(PASSWORD) } });
});

afterAll(cleanup);

describe("POST /api/mobile/auth/login", () => {
  it("returns a session token in the JSON body (not a cookie) for correct credentials", async () => {
    const response = await POST(loginRequest({ email: EMAIL, password: PASSWORD }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();

    const body = await response.json();
    const customer = await db.customer.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(verifySessionToken(body.token)).toBe(customer.id);
    expect(body.expiresInSeconds).toBeGreaterThan(0);
  });

  it("401s for a wrong password", async () => {
    const response = await POST(loginRequest({ email: EMAIL, password: "wrong password" }));
    expect(response.status).toBe(401);
  });

  it("401s for an unknown email", async () => {
    const response = await POST(loginRequest({ email: "no-such-customer@example.com", password: PASSWORD }));
    expect(response.status).toBe(401);
  });

  it("400s when email or password is missing", async () => {
    const response = await POST(loginRequest({ email: EMAIL }));
    expect(response.status).toBe(400);
  });
});
