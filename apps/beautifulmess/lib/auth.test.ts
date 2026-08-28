import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth";

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
