import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { customersToCsv, listCustomers } from "./customers";

const EMAIL = "admin-customers-test@example.com";
const OTHER_EMAIL = "admin-customers-test-2@example.com";
const LEGACY_PHONE = "9123456780";

let customerId: string;

async function cleanup() {
  await db.order.deleteMany({ where: { customer: { email: { in: [EMAIL, OTHER_EMAIL] } } } });
  await db.customer.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } });
  await db.customer.deleteMany({ where: { phone: LEGACY_PHONE } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({
    data: {
      email: EMAIL,
      name: "Admin Customers Test",
      addresses: {
        create: {
          label: "Home",
          name: "Admin Customers Test",
          phone: "9876543210",
          addressLine1: "1 Test Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          isDefault: true,
        },
      },
    },
  });
  customerId = customer.id;
  await db.customer.create({ data: { email: OTHER_EMAIL } });
});

afterAll(cleanup);

describe("listCustomers", () => {
  it("lists a customer with their phone (from their default saved address) and a zero order count", async () => {
    const customers = await listCustomers();
    const found = customers.find((c) => c.id === customerId);
    expect(found).toMatchObject({ email: EMAIL, name: "Admin Customers Test", phone: "9876543210", orderCount: 0 });
    expect(found?.lastOrderAt).toBeNull();
  });

  it("counts a customer's orders and reports their most recent order date", async () => {
    await db.order.create({ data: { customerId, status: "PAID" } });
    await db.order.create({ data: { customerId, status: "PENDING" } });

    const customers = await listCustomers();
    const found = customers.find((c) => c.id === customerId);
    expect(found?.orderCount).toBe(2);
    expect(found?.lastOrderAt).not.toBeNull();
  });

  it("reports null phone for a customer who never checked out", async () => {
    const customers = await listCustomers();
    const found = customers.find((c) => c.email === OTHER_EMAIL);
    expect(found?.phone).toBeNull();
  });

  it("lists a legacy phone-only contact (no email, no address) using Customer.phone directly", async () => {
    await db.customer.create({ data: { phone: LEGACY_PHONE, name: "Legacy Contact" } });
    const customers = await listCustomers();
    const found = customers.find((c) => c.phone === LEGACY_PHONE);
    expect(found).toMatchObject({ email: null, name: "Legacy Contact", phone: LEGACY_PHONE });
  });

  it("prefers Customer.phone over the default address's phone when both are set", async () => {
    await db.customer.create({
      data: {
        phone: LEGACY_PHONE,
        addresses: {
          create: {
            label: "Home",
            name: "Someone",
            phone: "9876500000",
            addressLine1: "2 Test Street",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
            isDefault: true,
          },
        },
      },
    });
    const customers = await listCustomers();
    const found = customers.find((c) => c.phone === LEGACY_PHONE);
    expect(found?.phone).toBe(LEGACY_PHONE);
  });
});

describe("customersToCsv", () => {
  it("produces a header row plus one row per customer, quoting fields", async () => {
    const csv = customersToCsv([
      {
        id: "1",
        email: "a@example.com",
        name: 'Jane "JJ" Doe',
        phone: "9999999999",
        createdAt: new Date("2026-01-01"),
        orderCount: 3,
        lastOrderAt: new Date("2026-02-15"),
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name,Email,Phone,Order Count,Last Order,Joined");
    expect(lines[1]).toBe('"Jane ""JJ"" Doe","a@example.com","9999999999","3","2026-02-15","2026-01-01"');
  });

  it("renders a blank email for a legacy phone-only contact", async () => {
    const csv = customersToCsv([
      {
        id: "1",
        email: null,
        name: "Legacy Contact",
        phone: "9123456780",
        createdAt: new Date("2026-01-01"),
        orderCount: 0,
        lastOrderAt: null,
      },
    ]);
    expect(csv.split("\n")[1]).toBe('"Legacy Contact","","9123456780","0","","2026-01-01"');
  });
});
