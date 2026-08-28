import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

beforeAll(() => {
  process.env.SESSION_SECRET = "test_session_secret_local_only";
});

describe("createSessionToken / verifySessionToken", () => {
  it("round-trips the customer id it was created for", () => {
    const token = createSessionToken("customer_123");
    expect(verifySessionToken(token)).toBe("customer_123");
  });

  it("rejects a token that has expired", () => {
    const issuedAt = Date.now() - 1000;
    const token = createSessionToken("customer_123", issuedAt);
    const wellAfterExpiry = issuedAt + 1000 * 60 * 60 * 24 * 31; // 31 days later
    expect(verifySessionToken(token, wellAfterExpiry)).toBeNull();
  });

  it("rejects a token with a tampered customer id", () => {
    const token = createSessionToken("customer_123");
    const [, expires, signature] = token.split(".");
    const tampered = `customer_456.${expires}.${signature}`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("rejects a token with a tampered expiry", () => {
    const token = createSessionToken("customer_123");
    const [customerId, expires, signature] = token.split(".");
    const tampered = `${customerId}.${Number(expires) + 1_000_000}.${signature}`;
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("rejects garbage input instead of throwing", () => {
    expect(verifySessionToken("not-a-real-token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });
});
