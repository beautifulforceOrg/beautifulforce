import { db } from "@storeforge/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { authenticateAdmin, hashPassword, isAllowedAdminEmail } from "./auth";

const ADMIN_EMAIL = "admin-auth-test@example.com";
const OTHER_EMAIL = "not-an-admin@example.com";
const PASSWORD = "correct horse battery";

async function cleanup() {
  await db.adminUser.deleteMany({ where: { email: { in: [ADMIN_EMAIL, OTHER_EMAIL] } } });
}

beforeAll(() => {
  process.env.ADMIN_ALLOWED_EMAILS = `${ADMIN_EMAIL}, other-admin@example.com`;
});

beforeEach(async () => {
  await cleanup();
  await db.adminUser.create({ data: { email: ADMIN_EMAIL, passwordHash: hashPassword(PASSWORD) } });
});

afterAll(cleanup);

describe("isAllowedAdminEmail", () => {
  it("accepts an email in the allowlist, case-insensitively", () => {
    expect(isAllowedAdminEmail(ADMIN_EMAIL)).toBe(true);
    expect(isAllowedAdminEmail(ADMIN_EMAIL.toUpperCase())).toBe(true);
  });

  it("rejects an email not in the allowlist", () => {
    expect(isAllowedAdminEmail(OTHER_EMAIL)).toBe(false);
  });
});

describe("authenticateAdmin", () => {
  it("returns the admin id for a correct email + password", async () => {
    const id = await authenticateAdmin(ADMIN_EMAIL, PASSWORD);
    expect(id).not.toBeNull();
  });

  it("returns null for a correct password but non-allowlisted email", async () => {
    await db.adminUser.create({ data: { email: OTHER_EMAIL, passwordHash: hashPassword(PASSWORD) } });
    expect(await authenticateAdmin(OTHER_EMAIL, PASSWORD)).toBeNull();
  });

  it("returns null for a wrong password", async () => {
    expect(await authenticateAdmin(ADMIN_EMAIL, "wrong password")).toBeNull();
  });

  it("locks the account after 5 failed attempts, rejecting even the correct password", async () => {
    for (let i = 0; i < 5; i++) {
      await authenticateAdmin(ADMIN_EMAIL, "wrong password");
    }
    expect(await authenticateAdmin(ADMIN_EMAIL, PASSWORD)).toBeNull();

    const admin = await db.adminUser.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
    expect(admin.lockedUntil).not.toBeNull();
  });

  it("resets the failed-attempt counter on a successful login", async () => {
    await authenticateAdmin(ADMIN_EMAIL, "wrong password");
    await authenticateAdmin(ADMIN_EMAIL, "wrong password");
    expect(await authenticateAdmin(ADMIN_EMAIL, PASSWORD)).not.toBeNull();

    const admin = await db.adminUser.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } });
    expect(admin.failedAttempts).toBe(0);
  });
});
