import { db } from "@storeforge/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { authenticateAdmin, hashPassword, isAllowedAdminEmail, isCustomerAnAdmin } from "./auth";

const ADMIN_EMAIL = "admin-auth-test@example.com";
const OTHER_EMAIL = "not-an-admin@example.com";
const PASSWORD = "correct horse battery";

const ALLOWLISTED_NO_ROW_EMAIL = "other-admin@example.com";

async function cleanup() {
  await db.adminUser.deleteMany({ where: { email: { in: [ADMIN_EMAIL, OTHER_EMAIL] } } });
  await db.customer.deleteMany({ where: { email: { in: [ADMIN_EMAIL, OTHER_EMAIL, ALLOWLISTED_NO_ROW_EMAIL] } } });
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

// A logged-in customer whose email matches an allowlisted AdminUser can
// jump straight into the admin dashboard without re-entering the admin
// password -- see the "Admin" tab in the site header. The actual session
// cookie is only ever written from a real request (app/admin/enter/route.ts,
// covered by e2e/admin-tab.spec.ts) -- cookies() throws outside a request
// scope, so establishAdminSessionForCustomer itself isn't unit-tested here,
// matching how createSession/createAdminSession aren't either.
describe("isCustomerAnAdmin", () => {
  it("recognizes a customer whose email matches an allowlisted AdminUser", async () => {
    const customer = await db.customer.create({ data: { email: ADMIN_EMAIL } });
    expect(await isCustomerAnAdmin(customer.id)).toBe(true);
  });

  it("rejects a customer whose email is not an admin", async () => {
    const customer = await db.customer.create({ data: { email: OTHER_EMAIL } });
    expect(await isCustomerAnAdmin(customer.id)).toBe(false);
  });

  it("rejects a customer email that is allowlisted but has no seeded AdminUser row", async () => {
    const customer = await db.customer.create({ data: { email: ALLOWLISTED_NO_ROW_EMAIL } });
    expect(await isCustomerAnAdmin(customer.id)).toBe(false);
  });

  it("returns false for a customer id that doesn't exist", async () => {
    expect(await isCustomerAnAdmin("does-not-exist")).toBe(false);
  });
});
