import { db } from "@storeforge/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken } from "../../../../lib/session-token";
import { POST } from "./route";

const PRODUCT_SLUG = "mobile-orders-test-product";
let productId: string;
let customerId: string;

async function cleanup() {
  // Deleting Order cascades to OrderItem (onDelete: Cascade on the order
  // side), so this is safe to do before removing the product/customer
  // those items reference.
  await db.order.deleteMany({
    where: {
      OR: [{ customer: { email: "mobile-orders-test@example.com" } }, { items: { some: { product: { slug: PRODUCT_SLUG } } } }],
    },
  });
  await db.product.deleteMany({ where: { slug: PRODUCT_SLUG } });
  await db.customer.deleteMany({ where: { email: "mobile-orders-test@example.com" } });
}

beforeEach(async () => {
  await cleanup();
  const product = await db.product.create({ data: { slug: PRODUCT_SLUG, name: "Mobile Orders Test Product", price: 100000 } });
  const customer = await db.customer.create({ data: { email: "mobile-orders-test@example.com" } });
  productId = product.id;
  customerId = customer.id;
});

afterAll(cleanup);

function orderRequest(body: unknown, authenticated = false): Request {
  return new Request("http://localhost/api/mobile/orders", {
    method: "POST",
    headers: authenticated ? { authorization: `Bearer ${createSessionToken(customerId)}` } : {},
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile/orders", () => {
  it("creates a PENDING order attached to the authenticated customer (under E2E_MOCK_EXTERNAL_APIS, isMocked is true)", async () => {
    const response = await POST(orderRequest({ lines: [{ productId, price: 100000, quantity: 2 }] }, true));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isMocked).toBe(true);
    expect(body.amount).toBe(200000);

    const order = await db.order.findUnique({ where: { gatewayOrderId: body.gatewayOrderId } });
    expect(order?.status).toBe("PENDING");
    expect(order?.customerId).toBe(customerId);
  });

  it("allows guest checkout with no Authorization header", async () => {
    const response = await POST(orderRequest({ lines: [{ productId, price: 100000, quantity: 1 }] }));
    expect(response.status).toBe(200);
    const body = await response.json();
    const order = await db.order.findUnique({ where: { gatewayOrderId: body.gatewayOrderId } });
    expect(order?.customerId).toBeNull();
  });

  it("applies a valid discount code to the total", async () => {
    const response = await POST(orderRequest({ lines: [{ productId, price: 100000, quantity: 1 }], discountCode: "MESS05" }));
    const body = await response.json();
    expect(body.amount).toBe(95000);
  });

  it("400s with no order lines", async () => {
    const response = await POST(orderRequest({ lines: [] }));
    expect(response.status).toBe(400);
  });
});
