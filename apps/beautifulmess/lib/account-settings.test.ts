import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "./auth";
import { changeEmailFor, changePasswordFor, getSavedAddressFor, saveAddressFor } from "./account-settings";

const EMAIL = "settings-test-customer@example.com";
const OTHER_EMAIL = "settings-test-other@example.com";
const PASSWORD = "correct horse battery";

let customerId: string;

async function cleanup() {
  await db.customer.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: EMAIL, passwordHash: hashPassword(PASSWORD) } });
  customerId = customer.id;
});

afterAll(cleanup);

describe("changeEmailFor", () => {
  it("changes the email when the current password is correct", async () => {
    const result = await changeEmailFor(customerId, "new-settings-test@example.com", PASSWORD);
    expect(result).toEqual({});
    const customer = await db.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.email).toBe("new-settings-test@example.com");
    await db.customer.deleteMany({ where: { email: "new-settings-test@example.com" } });
  });

  it("rejects a wrong current password", async () => {
    const result = await changeEmailFor(customerId, "new-settings-test@example.com", "wrong password");
    expect(result.error).toBe("Current password is incorrect.");
  });

  it("rejects an email already used by another account", async () => {
    await db.customer.create({ data: { email: OTHER_EMAIL, passwordHash: hashPassword(PASSWORD) } });
    const result = await changeEmailFor(customerId, OTHER_EMAIL, PASSWORD);
    expect(result.error).toBe("An account with this email already exists.");
  });

  it("is a no-op success when the new email is the same as the current one", async () => {
    const result = await changeEmailFor(customerId, EMAIL, PASSWORD);
    expect(result).toEqual({});
  });
});

describe("changePasswordFor", () => {
  it("changes the password when the current password is correct", async () => {
    const result = await changePasswordFor(customerId, PASSWORD, "a brand new password");
    expect(result).toEqual({});

    const rejected = await changeEmailFor(customerId, "irrelevant@example.com", PASSWORD);
    expect(rejected.error).toBe("Current password is incorrect.");
  });

  it("rejects a wrong current password", async () => {
    const result = await changePasswordFor(customerId, "wrong password", "a brand new password");
    expect(result.error).toBe("Current password is incorrect.");
  });

  it("rejects a new password shorter than 8 characters", async () => {
    const result = await changePasswordFor(customerId, PASSWORD, "short");
    expect(result.error).toBe("New password must be at least 8 characters.");
  });
});

describe("getSavedAddressFor / saveAddressFor", () => {
  const ADDRESS = {
    name: "Priya Nair",
    email: EMAIL,
    phone: "9999999999",
    addressLine1: "221 Residency Road",
    addressLine2: "Flat 12",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560025",
  };

  it("returns null when no address has been saved yet", async () => {
    expect(await getSavedAddressFor(customerId)).toBeNull();
  });

  it("saves and returns the address", async () => {
    await saveAddressFor(customerId, ADDRESS);
    expect(await getSavedAddressFor(customerId)).toEqual(ADDRESS);
  });

  it("overwrites a previously saved address", async () => {
    await saveAddressFor(customerId, ADDRESS);
    const updated = { ...ADDRESS, city: "Mumbai", pincode: "400001" };
    await saveAddressFor(customerId, updated);
    expect(await getSavedAddressFor(customerId)).toEqual(updated);
  });
});
