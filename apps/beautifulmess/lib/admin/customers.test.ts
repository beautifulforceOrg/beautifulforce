import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { customersToCsv, listCustomers } from "./customers";

const EMAIL = "admin-customers-test@example.com";
const OTHER_EMAIL = "admin-customers-test-2@example.com";

let customerId: string;

async function cleanup() {
  await db.order.deleteMany({ where: { customer: { email: { in: [EMAIL, OTHER_EMAIL] } } } });
  await db.customer.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({
    data: { email: EMAIL, name: "Admin Customers Test", addressPhone: "9876543210" },
  });
  customerId = customer.id;
  await db.customer.create({ data: { email: OTHER_EMAIL } });
});

afterAll(cleanup);

describe("listCustomers", () => {
  it("lists a customer with their phone (from addressPhone) and a zero order count", async () => {
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
});
