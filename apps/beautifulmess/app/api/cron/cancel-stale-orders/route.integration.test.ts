import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const EMAIL = "cron-cancel-stale-orders-test@example.com";
const SECRET = process.env.CRON_SECRET!;

let customerId: string;

async function cleanup() {
  await db.order.deleteMany({ where: { customer: { email: EMAIL } } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
}

function request(authHeader?: string): Request {
  return new Request("http://localhost/api/cron/cancel-stale-orders", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.create({ data: { email: EMAIL } });
  customerId = customer.id;
});

afterAll(cleanup);

describe("GET /api/cron/cancel-stale-orders", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await GET(request());
    expect(response.status).toBe(401);
  });

  it("rejects a request with the wrong secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));
    expect(response.status).toBe(401);
  });

  it("cancels stale orders and reports the count when the secret matches", async () => {
    const order = await db.order.create({ data: { customerId, status: "PENDING" } });
    await db.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    });

    const response = await GET(request(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.cancelledCount).toBeGreaterThanOrEqual(1);

    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("CANCELLED");
  });
});
