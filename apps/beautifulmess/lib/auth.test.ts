import { describe, expect, it } from "vitest";
import { getCustomerIdFromAuthHeader, hashPassword, verifyPassword } from "./auth";
import { createSessionToken } from "./session-token";

describe("hashPassword / verifyPassword", () => {
  it("verifies the correct password against its own hash", () => {
    const hash = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("correct horse battery");
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  it("never stores the password in plaintext", () => {
    const hash = hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
  });

  it("salts each hash differently, even for the same password", () => {
    const a = hashPassword("correct horse battery");
    const b = hashPassword("correct horse battery");
    expect(a).not.toBe(b);
    expect(verifyPassword("correct horse battery", a)).toBe(true);
    expect(verifyPassword("correct horse battery", b)).toBe(true);
  });

  it("rejects a malformed stored hash instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-real-hash")).toBe(false);
  });
});

describe("getCustomerIdFromAuthHeader", () => {
  // The mobile session token travels as a Bearer header instead of a
  // cookie, but it's verified by the exact same verifySessionToken() the
  // web cookie path uses -- this is the regression guard that the two
  // delivery mechanisms can't silently drift apart.
  it("accepts the same token format the cookie path issues via createSessionToken", () => {
    const token = createSessionToken("customer_123");
    const request = new Request("http://localhost/api/mobile/wishlist", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getCustomerIdFromAuthHeader(request)).toBe("customer_123");
  });

  it("returns null when there is no Authorization header", () => {
    const request = new Request("http://localhost/api/mobile/wishlist");
    expect(getCustomerIdFromAuthHeader(request)).toBeNull();
  });

  it("returns null for a non-Bearer Authorization header", () => {
    const request = new Request("http://localhost/api/mobile/wishlist", {
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(getCustomerIdFromAuthHeader(request)).toBeNull();
  });

  it("returns null for a tampered token, exactly like the cookie path would", () => {
    const token = createSessionToken("customer_123");
    const tampered = token.replace("customer_123", "customer_456");
    const request = new Request("http://localhost/api/mobile/wishlist", {
      headers: { authorization: `Bearer ${tampered}` },
    });
    expect(getCustomerIdFromAuthHeader(request)).toBeNull();
  });
});
