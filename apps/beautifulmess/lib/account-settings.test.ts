import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "./auth";
import {
  changeEmailFor,
  changePasswordFor,
  createAddressFor,
  deleteAddressFor,
  getDefaultAddressFor,
  listAddressesFor,
  saveFirstAddressFor,
  setDefaultAddressFor,
  updateAddressFor,
} from "./account-settings";

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

describe("address book", () => {
  const HOME = {
    name: "Priya Nair",
    phone: "9999999999",
    addressLine1: "221 Residency Road",
    addressLine2: "Flat 12",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560025",
  };
  const OFFICE = {
    name: "Priya Nair",
    phone: "8888888888",
    addressLine1: "50 MG Road",
    addressLine2: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  };

  describe("createAddressFor / listAddressesFor / getDefaultAddressFor", () => {
    it("returns an empty list and no default when nothing is saved yet", async () => {
      expect(await listAddressesFor(customerId)).toEqual([]);
      expect(await getDefaultAddressFor(customerId)).toBeNull();
    });

    it("makes the first saved address the default automatically", async () => {
      const created = await createAddressFor(customerId, "Home", HOME);
      expect(created.isDefault).toBe(true);

      const list = await listAddressesFor(customerId);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ label: "Home", ...HOME, isDefault: true });
      expect(await getDefaultAddressFor(customerId)).toMatchObject({ label: "Home" });
    });

    it("does not make a second address the default", async () => {
      await createAddressFor(customerId, "Home", HOME);
      const office = await createAddressFor(customerId, "Office", OFFICE);
      expect(office.isDefault).toBe(false);
      expect(await listAddressesFor(customerId)).toHaveLength(2);
    });
  });

  describe("updateAddressFor", () => {
    it("updates the address's fields and label", async () => {
      const created = await createAddressFor(customerId, "Home", HOME);
      const result = await updateAddressFor(customerId, created.id, "New Home", { ...HOME, city: "Mumbai" });
      expect(result).toEqual({});

      const list = await listAddressesFor(customerId);
      expect(list[0]).toMatchObject({ label: "New Home", city: "Mumbai" });
    });

    it("rejects updating another customer's address", async () => {
      const otherCustomer = await db.customer.create({ data: { email: OTHER_EMAIL } });
      const theirs = await createAddressFor(otherCustomer.id, "Home", HOME);
      const result = await updateAddressFor(customerId, theirs.id, "Hijacked", OFFICE);
      expect(result.error).toBe("Address not found.");
    });
  });

  describe("deleteAddressFor", () => {
    it("promotes the most recent remaining address to default when the default is deleted", async () => {
      const home = await createAddressFor(customerId, "Home", HOME);
      const office = await createAddressFor(customerId, "Office", OFFICE);
      expect(home.isDefault).toBe(true);

      await deleteAddressFor(customerId, home.id);

      const list = await listAddressesFor(customerId);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ id: office.id, isDefault: true });
    });

    it("rejects deleting another customer's address", async () => {
      const otherCustomer = await db.customer.create({ data: { email: OTHER_EMAIL } });
      const theirs = await createAddressFor(otherCustomer.id, "Home", HOME);
      const result = await deleteAddressFor(customerId, theirs.id);
      expect(result.error).toBe("Address not found.");
      expect(await listAddressesFor(otherCustomer.id)).toHaveLength(1);
    });
  });

  describe("setDefaultAddressFor", () => {
    it("switches the default to the chosen address and unsets the old one", async () => {
      const home = await createAddressFor(customerId, "Home", HOME);
      const office = await createAddressFor(customerId, "Office", OFFICE);

      await setDefaultAddressFor(customerId, office.id);

      const list = await listAddressesFor(customerId);
      expect(list.find((a) => a.id === office.id)?.isDefault).toBe(true);
      expect(list.find((a) => a.id === home.id)?.isDefault).toBe(false);
    });
  });

  describe("saveFirstAddressFor", () => {
    it("saves the address when the customer has none yet", async () => {
      await saveFirstAddressFor(customerId, HOME);
      const list = await listAddressesFor(customerId);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ label: "Home", isDefault: true, ...HOME });
    });

    it("does nothing if the customer already has a saved address", async () => {
      await createAddressFor(customerId, "Home", HOME);
      await saveFirstAddressFor(customerId, OFFICE);
      const list = await listAddressesFor(customerId);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject(HOME);
    });
  });
});
