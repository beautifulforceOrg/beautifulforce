import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createShiprocketProvider } from "./shiprocket-provider";

// onUnhandledRequest: "error" means this suite fails outright if it ever
// makes a real call -- no live Shiprocket account is needed to run it.
const server = setupServer(
  http.post("https://apiv2.shiprocket.in/v1/external/auth/login", () =>
    HttpResponse.json({ token: "mock-token" })
  ),
  http.post("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", () =>
    HttpResponse.json({
      shipment_id: 998877,
      awb_code: "AWB123",
      courier_name: "Test Courier",
      status: "NEW",
    })
  ),
  http.get("https://apiv2.shiprocket.in/v1/external/courier/track/awb/AWB123", () =>
    HttpResponse.json({
      tracking_data: {
        shipment_status: "IN TRANSIT",
        shipment_track_activities: [
          { status: "PICKED UP", location: "Bengaluru", date: "2026-01-01T10:00:00Z" },
        ],
      },
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const provider = createShiprocketProvider({
  email: "test@example.com",
  password: "secret",
  pickupLocation: "Test Warehouse",
});

const SHIP_TO = {
  name: "Shopper",
  email: "shopper@example.com",
  phone: "9999999999",
  addressLine1: "1 MG Road",
  addressLine2: "Flat 4B",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

describe("createShiprocketProvider", () => {
  it("creates a shipment and returns a normalized shape", async () => {
    const shipment = await provider.createShipment({
      orderId: "order_1",
      orderDate: "2026-01-01",
      shipTo: SHIP_TO,
      items: [{ name: "Sample Item", sku: "item-1", units: 1, sellingPrice: 5500 }],
      packageWeightKg: 0.15,
      dimensionsCm: { length: 12, breadth: 10, height: 3 },
    });

    expect(shipment).toEqual({
      shipmentId: "998877",
      awbCode: "AWB123",
      courierName: "Test Courier",
      status: "NEW",
    });
  });

  it("sends every field Shiprocket's real API requires to accept an order", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    server.use(
      http.post("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ shipment_id: 998877, status: "NEW" });
      })
    );

    await provider.createShipment({
      orderId: "order_3",
      orderDate: "2026-01-01",
      shipTo: SHIP_TO,
      items: [{ name: "Sample Item", sku: "item-1", units: 2, sellingPrice: 5500 }],
      packageWeightKg: 0.15,
      dimensionsCm: { length: 12, breadth: 10, height: 3 },
    });

    expect(capturedBody).toMatchObject({
      pickup_location: "Test Warehouse",
      payment_method: "Prepaid",
      billing_email: "shopper@example.com",
      billing_address_2: "Flat 4B",
      billing_country: "India",
      shipping_is_billing: true,
      sub_total: 110,
      length: 12,
      breadth: 10,
      height: 3,
      weight: 0.15,
    });
  });

  it("tracks a shipment by AWB code", async () => {
    const tracking = await provider.trackShipment("AWB123");

    expect(tracking.status).toBe("IN TRANSIT");
    expect(tracking.checkpoints).toHaveLength(1);
    expect(tracking.checkpoints[0]?.location).toBe("Bengaluru");
  });

  it("throws a descriptive error when authentication fails", async () => {
    server.use(
      http.post("https://apiv2.shiprocket.in/v1/external/auth/login", () =>
        HttpResponse.text("Invalid credentials", { status: 401 })
      )
    );

    await expect(
      provider.createShipment({
        orderId: "order_2",
        orderDate: "2026-01-01",
        shipTo: SHIP_TO,
        items: [],
        packageWeightKg: 0.15,
        dimensionsCm: { length: 12, breadth: 10, height: 3 },
      })
    ).rejects.toThrow(/401/);
  });
});
